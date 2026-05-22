interface Props {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: Props) {
  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-gray-600 mt-1">{description}</p>}
      </header>
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <p className="text-gray-500">Modulo en desarrollo. Pronto disponible.</p>
      </div>
    </div>
  );
}
