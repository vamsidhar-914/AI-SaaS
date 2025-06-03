import { WatsonXAI } from "@ibm-cloud/watsonx-ai";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { WatsonxEmbeddings } from "@langchain/community/embeddings/ibm";
import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { SendMessageValidator } from "~/lib/validators/validator";
import { db } from "~/server/db";
import { IamAuthenticator } from "ibm-cloud-sdk-core";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { StringOutputParser } from "@langchain/core/output_parsers";
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse  } from "ai"

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const body = await req.json();
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, fileId } = SendMessageValidator.parse(body);

    const file = await db.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await db.message.create({
      data: {
        isUserMessage: true,
        text: message,
        fileId,
        userId,
      },
    });

    // Vectorize the message
    const embeddings = new WatsonxEmbeddings({
      watsonxAIAuthType: "iam",
      watsonxAIApikey: env.WATSONX_API_KEY,
      projectId: "86daf66f-b8fe-4c05-8333-f1d92548b88c",
      model: "intfloat/multilingual-e5-large",
      serviceUrl: "https://eu-de.ml.cloud.ibm.com",
      version: "2022-01-01",
    });

    const supabaseClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_PRIVATE_KEY,
    );
    const vectorStore = await SupabaseVectorStore.fromExistingIndex(
      embeddings,
      {
        client: supabaseClient,
        tableName: "documents",
        queryName: "match_documents",
        filter: {
          fileId: fileId
        }
      },
    );

    const results = await vectorStore.similaritySearch(message, 4 );

    const prevMessages = await db.message.findMany({
      where: { fileId },
      orderBy: { createdAt: "asc" },
      take: 6,
    });

    const formattedPrevMessages = prevMessages.map((msg) => ({
      role: msg.isUserMessage ? "user" : "assistant",
      content: msg.text,
    }));

    const prompt = `
Use the following pieces of context (or previous conversation if needed) to answer the user's question in markdown format.
If you don't know the answer, just say that you don't know — don't try to make up an answer.

----------------

PREVIOUS CONVERSATION:
${formattedPrevMessages
  .map((msg) =>
    msg.role === "user" ? `User: ${msg.content}` : `Assistant: ${msg.content}`,
  )
  .join("\n")}

----------------

CONTEXT:
${results.map((r) => r.pageContent).join("\n\n")}

USER INPUT: ${message}
        `.trim();

    // const watsonxAIService = WatsonXAI.newInstance({
    //   authenticator: new IamAuthenticator({
    //     apikey: env.WATSONX_API_KEY,
    //   }),
    //   serviceUrl: "https://eu-de.ml.cloud.ibm.com",
    //   version: "2022-01-01",
    // });
    // const textGeneration = await watsonxAIService.generateText({
    //   input: prompt,
    //   modelId: "ibm/granite-3-3-8b-instruct",
    //   projectId: "86daf66f-b8fe-4c05-8333-f1d92548b88c",
    //   parameters: {
    //     max_new_tokens: 100,
    //     decoding_method: "greedy",
    //   },
    // });

    // const responseData = textGeneration.result.results[0]?.generated_text

    // const llm = new ChatOllama({
    //   baseUrl: "http://localhost:11434",
    //   model: "llama3.2:latest",
    //   temperature: 0,
    //   numPredict: 150,
    // });

    // const chain = llm.pipe(new StringOutputParser());
    // const responseData = await chain.invoke(prompt);

  // Use fetch to call OpenRouter API directly for streaming compatibility
  const fetchResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer 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",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-8b-instruct:free",
      temperature: 0,
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
        },
        {
          role: 'user',
          content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
          
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedPrevMessages.map((message) => {
    if (message.role === 'user')
      return `User: ${message.content}\n`
    return `Assistant: ${message.content}\n`
  })}
  
  \n----------------\n
  
  CONTEXT:
  ${results.map((r) => r.pageContent).join('\n\n')}
  
  USER INPUT: ${message}`,
        },
      ],
    }),
  });

  const stream = OpenAIStream(fetchResponse, {
    async onCompletion(completion) {
      await db.message.create({
        data: {
          text: completion,
          isUserMessage: false,
          fileId,
          userId
        }
      })
    }
  });

  return new StreamingTextResponse(stream);

    // return NextResponse.json(responseData);
  } catch (err) {
    console.error("Error in /api/message:", err);
    return NextResponse.json({ error: `err:${err}` }, { status: 500 });
  }
}
