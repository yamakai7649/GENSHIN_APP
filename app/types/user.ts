export type CurrentUser = {
  id: number
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  userType: "human" | "agent"
  email: string
}
