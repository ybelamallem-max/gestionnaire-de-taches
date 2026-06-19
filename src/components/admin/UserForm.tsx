import { useEffect, useMemo, useState } from "react"
import { format, isValid, parseISO } from "date-fns"

import { Button } from "@/components/ui/button"
import { DatePickerField } from "@/components/ui/date-picker-field"
import { FieldError } from "@/components/ui/field-error"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  AdminUser,
  AdminUserGender,
  AdminUserPayload,
  AdminUserRole,
} from "@/hooks/useAdminUsers"
import type { ApiValidationErrors } from "@/services/apiErrors"

type UserFormProps = {
  initialUser?: AdminUser | null
  isSubmitting?: boolean
  errors?: ApiValidationErrors | null
  onCancel: () => void
  onSubmit: (payload: AdminUserPayload) => Promise<void> | void
}

function parseBirthDate(value: string | null | undefined) {
  if (!value) return undefined

  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

export function UserForm({
  initialUser,
  isSubmitting = false,
  errors,
  onCancel,
  onSubmit,
}: UserFormProps) {
  const isEditing = Boolean(initialUser)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined)
  const [gender, setGender] = useState<AdminUserGender | "">("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<AdminUserRole>("user")

  useEffect(() => {
    setName(initialUser?.name ?? "")
    setEmail(initialUser?.email ?? "")
    setPhone(initialUser?.phone ?? "")
    setBirthDate(parseBirthDate(initialUser?.birth_date))
    setGender(initialUser?.gender ?? "")
    setPassword("")
    setRole(initialUser?.role ?? "user")
  }, [initialUser])

  const isDisabled = useMemo(() => {
    return isSubmitting || !name.trim() || !email.trim() || (!isEditing && !password.trim())
  }, [email, isEditing, isSubmitting, name, password])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    await onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      birth_date: birthDate ? format(birthDate, "yyyy-MM-dd") : null,
      gender: gender || undefined,
      password: password.trim() || undefined,
      role,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="user-name" className="text-xs font-medium text-muted-foreground">
            Nom
          </label>
          <Input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet"
          />
          <FieldError errors={errors?.name} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="user-email" className="text-xs font-medium text-muted-foreground">
            Email
          </label>
          <Input
            id="user-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            type="email"
          />
          <FieldError errors={errors?.email} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="user-phone" className="text-xs font-medium text-muted-foreground">
            Téléphone
          </label>
          <Input
            id="user-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            type="tel"
          />
          <FieldError errors={errors?.phone} />
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">Date de naissance</div>
          <DatePickerField value={birthDate} onChange={setBirthDate} />
          <FieldError errors={errors?.birth_date} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">Genre</div>
          <Select value={gender} onValueChange={(value) => setGender(value as AdminUserGender)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Sélectionner un genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Homme</SelectItem>
              <SelectItem value="female">Femme</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
          <FieldError errors={errors?.gender} />
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">Rôle</div>
          <Select value={role} onValueChange={(value) => setRole(value as AdminUserRole)}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Utilisateur</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <FieldError errors={errors?.role} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="user-password" className="text-xs font-medium text-muted-foreground">
          Mot de passe
        </label>
        <Input
          id="user-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={
            isEditing ? "Laisser vide pour ne pas changer" : "Saisir un mot de passe"
          }
          type="password"
          autoComplete={isEditing ? "new-password" : "off"}
        />
        <FieldError errors={errors?.password} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isDisabled}
        >
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  )
}
