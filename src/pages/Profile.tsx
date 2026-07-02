import { useState, useEffect, useRef } from "react"
import { User, Mail, Shield, Camera, Key, Save, Upload, Settings, Eye, EyeOff } from "lucide-react"
import { Link } from "react-router-dom"
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
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez vos informations personnelles et votre sécurité.
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <Link to="/settings" className="flex items-center gap-3 text-sm font-medium hover:text-primary transition-colors">
            <Settings className="size-4" />
            Paramètres de l'application
          </Link>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50">
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
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => inputRef.current?.click()}
                >
                  <Avatar className="size-24 ring-4 ring-background group-hover:ring-muted/50 transition-all">
                    <AvatarImage src={avatarPreview || user?.avatar} alt={formatDisplayName(user)} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {getAvatarInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-background">
                    <Camera className="size-4" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Input
                      ref={inputRef}
                      id="avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Button variant="outline" onClick={() => inputRef.current?.click()}>
                      <Upload className="mr-2 size-4" />
                      Choisir une photo
                    </Button>
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
              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="display-name" className="text-sm font-medium">Nom d'affichage</Label>
                  <div className="flex items-center gap-3">
                    <User className="size-4 text-muted-foreground shrink-0" />
                    <Input
                      id="display-name"
                      value={formatDisplayName(user)}
                      disabled
                      className="bg-muted/50"
                    />
                    {user?.tag && (
                      <span className="text-sm text-muted-foreground">#{user.tag}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nom</Label>
                  <div className="flex items-center gap-3">
                    <User className="size-4 text-muted-foreground shrink-0" />
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-muted-foreground shrink-0" />
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
                  <Label htmlFor="current-password-profile" className="text-sm font-medium">Mot de passe actuel (confirmation)</Label>
                  <div className="relative flex items-center gap-3">
                    <Key className="size-4 text-muted-foreground shrink-0" />
                    <Input
                      id="current-password-profile"
                      type={showPassword ? "text" : "password"}
                      value={profileForm.current_password}
                      onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 size-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
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
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 w-fit">
                <Shield className="size-4 text-muted-foreground shrink-0" />
                <span className="capitalize font-medium">{user?.role || "user"}</span>
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
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-sm font-medium">Mot de passe actuel</Label>
                  <div className="flex items-center gap-3">
                    <Key className="size-4 text-muted-foreground shrink-0" />
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
                  <Label htmlFor="new-password" className="text-sm font-medium">Nouveau mot de passe</Label>
                  <div className="flex items-center gap-3">
                    <Key className="size-4 text-muted-foreground shrink-0" />
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
                  <Label htmlFor="confirm-password" className="text-sm font-medium">Confirmer le nouveau mot de passe</Label>
                  <div className="flex items-center gap-3">
                    <Key className="size-4 text-muted-foreground shrink-0" />
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

                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
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
