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
          <label htmlFor="user-name" className="text-xs font-medium text-zinc-300">
            Nom
          </label>
          <Input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom complet"
            className="h-10 border-zinc-800 bg-zinc-950/40 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-700/40"
          />
          <FieldError errors={errors?.name} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="user-email" className="text-xs font-medium text-zinc-300">
            Email
          </label>
          <Input
            id="user-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            type="email"
            className="h-10 border-zinc-800 bg-zinc-950/40 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-700/40"
          />
          <FieldError errors={errors?.email} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="user-phone" className="text-xs font-medium text-zinc-300">
            Téléphone
          </label>
          <Input
            id="user-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            type="tel"
            className="h-10 border-zinc-800 bg-zinc-950/40 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-700/40"
          />
          <FieldError errors={errors?.phone} />
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-zinc-300">Date de naissance</div>
          <DatePickerField value={birthDate} onChange={setBirthDate} />
          <FieldError errors={errors?.birth_date} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-zinc-300">Genre</div>
          <Select value={gender} onValueChange={(value) => setGender(value as AdminUserGender)}>
            <SelectTrigger className="h-10 w-full border-zinc-800 bg-zinc-950/40 text-zinc-100 data-[placeholder]:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-700/40">
              <SelectValue placeholder="Sélectionner un genre" />
            </SelectTrigger>
            <SelectContent className="border border-zinc-800 bg-zinc-950 text-zinc-100">
              <SelectItem value="male">Homme</SelectItem>
              <SelectItem value="female">Femme</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
          <FieldError errors={errors?.gender} />
        </div>

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-zinc-300">Rôle</div>
          <Select value={role} onValueChange={(value) => setRole(value as AdminUserRole)}>
            <SelectTrigger className="h-10 w-full border-zinc-800 bg-zinc-950/40 text-zinc-100 data-[placeholder]:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-700/40">
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent className="border border-zinc-800 bg-zinc-950 text-zinc-100">
              <SelectItem value="user">Utilisateur</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <FieldError errors={errors?.role} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="user-password" className="text-xs font-medium text-zinc-300">
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
          className="h-10 border-zinc-800 bg-zinc-950/40 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-700/40"
        />
        <FieldError errors={errors?.password} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isDisabled}
          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-100/90"
        >
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  )
}
