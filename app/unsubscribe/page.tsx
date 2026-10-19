import Unsubscribe from "@/components/unsubscribe";
export const dynamic = "force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<{token?:string}>}) {const {token}=await searchParams;return <Unsubscribe token={token??""}/>;}
