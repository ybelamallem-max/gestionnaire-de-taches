type FieldErrorProps = {
  errors?: string[] | null
}

export function FieldError({ errors }: FieldErrorProps) {
  if (!errors?.length) return null
  return <div className="mt-1 text-xs text-red-300">{errors[0]}</div>
}

