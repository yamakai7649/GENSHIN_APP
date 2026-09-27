export type Agent = {
  userId: number
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  specialty: string
  mission: string
  instructions: string | null
  status: "active" | "paused"
}
