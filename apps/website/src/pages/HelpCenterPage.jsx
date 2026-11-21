import ResourcePageLayout from "../components/ResourcePageLayout.jsx";

const questions = [
  {
    question: "What is TaskFlow?",
    answer:
      "TaskFlow is a productivity workspace for organizing tasks and daily habits. The web app is available from the Get Started page.",
  },
  {
    question: "How do I create an account or save my tasks?",
    answer:
      "Open the web app to add and manage tasks and habits. Your data is saved locally in the browser on this device; account-based cloud sync is not available yet.",
  },
  {
    question: "Can I install TaskFlow on Windows?",
    answer:
      "Yes. Open the Get Started page in Microsoft Edge or Chrome on Windows and choose Install TaskFlow. The installed web app works offline after its first successful load.",
  },
  {
    question: "Is there an Android app?",
    answer:
      "The Get Started page links to the Android APK in the latest GitHub Release. Follow Android's installation prompt after downloading it.",
  },
  {
    question: "What do the priority and progress indicators mean?",
    answer:
      "In the web app, task priorities and progress are based on the tasks you manage in this browser. The marketing pages also contain illustrative interface previews.",
  },
  {
    question: "Where can I report a question?",
    answer:
      "For this concept demo, you can use the contact email shown in the footer. The address is a placeholder and should be replaced by the site operator before launch.",
  },
];

export default function HelpCenterPage() {
  return (
    <ResourcePageLayout
      kicker="TASKFLOW / HELP CENTER"
      title="How can we help?"
      description="Answers to common questions about the TaskFlow concept and what you can do with this demo."
      showDemoNote={false}
    >
      <section className="resource-faq" aria-label="Frequently asked questions">
        {questions.map(({ question, answer }, index) => (
          <details key={question} open={index === 0}>
            <summary>
              {question}
              <span aria-hidden="true"></span>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>
      <section className="resource-contact">
        <div>
          <span className="section-kicker">STILL HAVE A QUESTION?</span>
          <h2>We’re happy to hear from you.</h2>
          <p>
            This demo has no support desk, but you can reach the site contact
            below.
          </p>
        </div>
        <a className="button button-primary" href="mailto:hello@taskflow.example">
          Contact TaskFlow <span aria-hidden="true">↗</span>
        </a>
      </section>
    </ResourcePageLayout>
  );
}
