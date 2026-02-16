interface CardProps {
  title: string
  children: React.ReactNode
}

export default function Card({ title, children }: CardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </div>
  )
}
