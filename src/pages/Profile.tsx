import { useState, useEffect } from "react"
import { User, Mail, Shield, Camera, Key, Save, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/services/api"
import { useAuthStore } from "@/stores/authStore"
import { formatDisplayName, getAvatarInitials } from "@/lib/users"
import { useToast } from "@/hooks/use-toast"

export default function Profile() {
  const { user, setUser } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    current_password: "",
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  })

  // Avatar file state
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.put("/profile", profileForm)
      const response = await api.get("/me")
      setUser(response.data.user)
      setProfileForm({ ...profileForm, current_password: "" })
      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.put("/profile/password", passwordForm)
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      })
      toast({
        title: "Succès",
        description: "Votre mot de passe a été mis à jour.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "L'image ne doit pas dépasser 2MB.",
        })
        return
      }

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Formats acceptés: JPG, PNG, WebP.",
        })
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return

    setLoading(true)
    const formData = new FormData()
    formData.append("avatar", avatarFile)

    try {
      await api.post("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const response = await api.get("/me")
      setUser(response.data.user)
      setAvatarFile(null)
      setAvatarPreview(null)
      toast({
        title: "Succès",
        description: "Votre photo de profil a été mise à jour.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.response?.data?.message || "Une erreur est survenue.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles et votre sécurité.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Informations</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Photo de profil</CardTitle>
              <CardDescription>
                Changez votre photo de profil. Formats acceptés: JPG, PNG, WebP (max 2MB).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="size-24">
                  <AvatarImage src={avatarPreview || user?.avatar} alt={formatDisplayName(user)} />
                  <AvatarFallback className="text-2xl">
                    {getAvatarInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Label htmlFor="avatar">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="mr-2 size-4" />
                          Choisir une photo
                        </span>
                      </Button>
                    </Label>
                  </div>
                  {avatarPreview && (
                    <Button onClick={handleAvatarUpload} disabled={loading}>
                      <Save className="mr-2 size-4" />
                      {loading ? "Envoi..." : "Enregistrer"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Mettez à jour vos informations personnelles. La confirmation de votre mot de passe est requise.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Nom d'affichage</Label>
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <Input
                      id="display-name"
                      value={formatDisplayName(user)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-password-profile">Mot de passe actuel (confirmation)</Label>
                  <div className="flex items-center gap-2">
                    <Key className="size-4 text-muted-foreground" />
                    <Input
                      id="current-password-profile"
                      type="password"
                      value={profileForm.current_password}
                      onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 size-4" />
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rôle</CardTitle>
              <CardDescription>Votre rôle dans l'application.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-muted-foreground" />
                <span className="capitalize">{user?.role || "user"}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
              <CardDescription>
                Assurez-vous que votre nouveau mot de passe est sécurisé.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                  <div className="flex items-center gap-2">
                    <Key className="size-4 text-muted-foreground" />
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <div className="flex items-center gap-2">
                    <Key className="size-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordForm.password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                  <div className="flex items-center gap-2">
                    <Key className="size-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordForm.password_confirmation}
                      onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 size-4" />
                  {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
