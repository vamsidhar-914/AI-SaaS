import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import Navbar from "../_components/Navbar"
import { db } from "~/server/db"

const DashboardPage = async () => {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if(!user || !user.id) redirect("/auth-callback?origin=dashboard")

    const dbUser = await db.user.findFirst({
        where: {
            id: user.id
        }
    })

    if(!dbUser) redirect("/auth-callback?origin=dashboard")
    
    return(
      <>
        <Navbar />
        <div>
            <h1>This is a dashboard</h1>
            <h1>{user?.email}</h1>
        </div>
      </>
    )   
}

export default DashboardPage