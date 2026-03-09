import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const guides = [
  {
    title: "What are Event Contracts?",
    description:
      "Learn about the basics of trading on real-world events and how contracts work.",
    icon: "📚",
  },
  {
    title: "How to Place Your First Trade",
    description:
      "Step-by-step guide to buying and selling contracts on SENQ.",
    icon: "🎯",
  },
  {
    title: "Understanding Risk",
    description:
      "Learn about the risks involved in trading and how to manage your portfolio.",
    icon: "⚠️",
  },
  {
    title: "Market Resolution",
    description:
      "How markets are resolved and when you get paid out on winning positions.",
    icon: "✅",
  },
  {
    title: "Advanced Strategies",
    description:
      "Tips and strategies for more experienced traders looking to optimize returns.",
    icon: "🧠",
  },
  {
    title: "FAQ",
    description:
      "Frequently asked questions about SENQ and prediction markets.",
    icon: "❓",
  },
];

export default function LearnPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Learn</h1>
        <p className="text-gray-600">
          Understand how prediction markets work and become a better trader
        </p>
      </div>

      {/* Guides Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {guides.map((guide, index) => (
          <Card
            key={index}
            className="border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
          >
            <CardContent className="p-6">
              <div className="text-4xl mb-4">{guide.icon}</div>
              <h3 className="font-semibold text-black mb-2">{guide.title}</h3>
              <p className="text-gray-600 text-sm">{guide.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Video Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-black mb-6">Video Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-gray-200">
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Video placeholder
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-black">Getting Started with SENQ</h3>
                <p className="text-sm text-gray-500">5 min • Beginner</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg
                    className="w-16 h-16 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Video placeholder
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-black">Understanding Market Prices</h3>
                <p className="text-sm text-gray-500">8 min • Intermediate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
