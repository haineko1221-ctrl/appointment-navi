import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              📅 アポイントナビ
            </Link>
          </div>
          <div className="flex space-x-8">
            <Link
              href="/"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent"
            >
              ダッシュボード
            </Link>
            <Link
              href="/people"
              className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent"
            >
              👥 人物一覧
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
