import { Link } from "react-router-dom";

import { Button, Card, Icon } from "../components/ui";

function Home() {
  const features = [
    {
      title: "Translation",
      description: "Convert roman Tamil into readable Tamil script for daily practice.",
      href: "/translator",
      icon: "translate",
    },
    {
      title: "Pronunciation",
      description: "Record your Tamil speech and receive targeted clarity feedback.",
      href: "/pronunciation",
      icon: "mic",
    },
    {
      title: "OCR Scanner",
      description: "Extract Tanglish or Tamil text from notes, worksheets, and images.",
      href: "/ocr",
      icon: "scan",
    },
    {
      title: "Entity Recognition",
      description: "Identify names, places, dates, and learner-friendly context in text.",
      href: "/entities",
      icon: "entity",
    },
    {
      title: "Sentence Generation",
      description: "Build Tamil sentences with tense, gender, noun, and verb controls.",
      href: "/sentence",
      icon: "sentence",
    },
  ];

  return (
    <div className="fade-in">
      <section className="page-shell grid min-h-[calc(100vh-190px)] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <span className="badge border-indigo-100 bg-indigo-50 text-indigo-700">
            <Icon name="spark" className="h-4 w-4" />
            AI-powered Tamil learning
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight text-gray-950 sm:text-6xl">
            Learn Tamil with focused tools for real practice.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-500">
            Ainthamizh AI combines translation, pronunciation feedback, OCR,
            entity analysis, and grammar generation in one clean learning workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button as={Link} to="/dashboard">
              Open dashboard
              <Icon name="arrow" className="h-4 w-4" />
            </Button>
            <Button as={Link} to="/translator" variant="secondary">
              Try translator
            </Button>
          </div>
        </div>

        <Card className="relative overflow-hidden p-0">
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
            <p className="text-sm font-semibold text-gray-500">Today&apos;s Tamil desk</p>
          </div>
          <div className="grid gap-4 p-5">
            {features.slice(0, 4).map((feature, index) => (
              <Link
                key={feature.title}
                to={feature.href}
                className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Icon name={feature.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-950">{feature.title}</p>
                  <p className="mt-1 truncate text-sm text-gray-500">{feature.description}</p>
                </div>
                <span className="text-sm font-semibold text-indigo-600">0{index + 1}</span>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="page-shell pt-0">
        <div className="mb-6">
          <h2 className="section-title">Practice Tools</h2>
          <p className="mt-2 text-gray-500">Purpose-built cards for language learning workflows.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {features.map((feature) => (
            <Card key={feature.title} className="flex flex-col">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Icon name={feature.icon} />
              </span>
              <h3 className="mt-5 card-title">{feature.title}</h3>
              <p className="mt-2 flex-1 helper-text">{feature.description}</p>
              <Button as={Link} to={feature.href} variant="secondary" className="mt-5 w-full">
                Open
                <Icon name="arrow" className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
