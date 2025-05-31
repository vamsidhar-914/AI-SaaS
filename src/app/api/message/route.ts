import { WatsonXAI } from "@ibm-cloud/watsonx-ai";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { WatsonxEmbeddings } from "@langchain/community/embeddings/ibm";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { PineconeStore } from "@langchain/pinecone";
import { NextRequest, NextResponse } from "next/server";
import { env } from "~/env";
import { pc } from "~/lib/pinecone";
import { SendMessageValidator } from "~/lib/validators/validator";
import { db } from "~/server/db";
import { IamAuthenticator } from "ibm-cloud-sdk-core";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

export async function POST(req: NextRequest,res: NextResponse) {
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
    // const pineconeIndex = pc.Index("saas");

    // const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    //   pineconeIndex,
    //   namespace: file.id,
    // });

    const supabaseClient = createClient(
                env.SUPABASE_URL,
                  env.SUPABASE_PRIVATE_KEY,
            )
    console.log("querying...vectorStore")
    const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings,{
        client: supabaseClient,
        tableName: 'documents',
        queryName: "match_documents"
    })

    const results = await vectorStore.similaritySearch(message, 4);

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

    const watsonxAIService = WatsonXAI.newInstance({
      authenticator: new IamAuthenticator({
        apikey: env.WATSONX_API_KEY,
      }),
      serviceUrl: "https://eu-de.ml.cloud.ibm.com",
      version: "2022-01-01",
    });
    const textGeneration = await watsonxAIService.generateText({
      input: prompt,
      modelId: "ibm/granite-3-3-8b-instruct",
      projectId: "86daf66f-b8fe-4c05-8333-f1d92548b88c",
      parameters: {
        max_new_tokens: 100,
        decoding_method: "greedy",
      },
    });

    const responseData = textGeneration.result.results[0]?.generated_text

    // const llm = new ChatOllama({
    //     baseUrl: "http://localhost:11434",
    //     model: "llama3.2:latest",
    //     temperature: 0,
    //     numPredict: 450
    // })

    // const chain = llm.pipe(new StringOutputParser())
    // const response = await chain.invoke(prompt)

    // console.log("response",response);

    await db.message.create({
      data: {
        text: responseData!,
        isUserMessage: false,
        fileId,
        userId,
      },
    });

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("Error in /api/message:", err);
    return NextResponse.json(
      { error: `err:${err}`},
      { status: 500 },
    );
  }
}
