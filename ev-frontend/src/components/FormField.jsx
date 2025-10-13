export default function FormField({ label, name, type="text", register, error, ...rest }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input className="input" type={type} {...register(name)} {...rest} />
      {error && <p className="text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
