import ResourcePageLayout from "../components/ResourcePageLayout.jsx";

const sections = [
  {
    id: "workspace",
    title: "Workspace overview",
    paragraphs: [
      "The dashboard preview brings a daily task list, project labels, and progress summaries together in one view.",
      "All names, task counts, dates, and progress values shown in the interface are sample content for the visual concept.",
    ],
  },
  {
    id: "tasks",
    title: "Tasks and priorities",
    paragraphs: [
      "The mockup illustrates task rows with completion checkboxes, due times, project categories, and high, medium, or low priority labels.",
      "In the web app, you can create, complete, search, filter, and delete tasks. Changes are saved locally in this browser.",
    ],
  },
  {
    id: "projects",
    title: "Projects and categories",
    paragraphs: [
      "Sample categories such as Personal, Work, and Learning show one way tasks could be grouped in a future product.",
      "Tasks and habits are stored in the browser on this device. They are not synced to an account or other devices.",
    ],
  },
  {
    id: "progress",
    title: "Planning and progress",
    paragraphs: [
      "Calendar cards, weekly charts, streaks, and completion indicators are illustrative dashboard components.",
      "The web app calculates its task completion progress from your saved tasks; marketing page previews remain illustrative.",
    ],
  },
  {
    id: "platforms",
    title: "Access and platforms",
    paragraphs: [
      "The Get Started page links to the Android APK in the latest GitHub Release. Download it on your device and follow Android's installation prompt. An iOS App Store version is not available.",
      "On Windows, open Get Started in Microsoft Edge or Chrome and choose Install TaskFlow to add the web app to your desktop. It is available offline after the first successful load.",
      "The web and mobile apps store tasks and habits locally on the device; account-based cloud sync is not available yet.",
    ],
  },
];

export default function DocumentationPage() {
  return (
    <ResourcePageLayout
      kicker="TASKFLOW / DOCUMENTATION"
      title="A guide to the workspace."
      description="Learn what the dashboard previews and how its example sections are intended to fit together."
      showDemoNote={false}
    >
      <div className="documentation-layout">
        <nav className="documentation-nav" aria-label="Documentation sections">
          <strong>ON THIS PAGE</strong>
          {sections.map(({ id, title }) => (
            <a key={id} href={`#${id}`}>
              {title}
            </a>
          ))}
        </nav>
        <div className="documentation-content">
          {sections.map(({ id, title, paragraphs }, index) => (
            <section id={id} key={id} className="documentation-section">
              <span className="documentation-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2>{title}</h2>
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </ResourcePageLayout>
  );
}
