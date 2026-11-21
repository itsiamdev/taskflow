import { useEffect, useState } from "react";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";
import BetaCountdownSection from "../components/BetaCountdownSection.jsx";

const steps = [
  {
    number: "01",
    title: "Capture what’s on your mind",
    description: "Bring tasks, ideas, and reminders together in one place.",
  },
  {
    number: "02",
    title: "Choose what matters today",
    description: "Set a clear priority and give your day a little structure.",
  },
  {
    number: "03",
    title: "Make steady progress",
    description: "Focus on one thing at a time and notice what you accomplish.",
  },
];

function PhonePreviews() {
  return (
    <div className="download-phone-art" aria-hidden="true">
      <div className="download-phone phone-back">
        <div className="phone-screen">
          <div className="phone-status"><span>9:41</span><span>● ● ▰</span></div>
          <div className="phone-app-heading">
            <span>MONDAY, OCTOBER 26</span>
            <strong>Good morning, Alex <b>✳</b></strong>
          </div>
          <div className="phone-summary">
            <span>Today&apos;s progress</span>
            <strong>5 of 8 tasks</strong>
            <i><span /></i>
          </div>
          <div className="phone-list-heading">Today&apos;s tasks <span>＋</span></div>
          <div className="phone-task is-done"><i>✓</i><span>Review project brief<small>Work · 9:00 AM</small></span></div>
          <div className="phone-task"><i /><span>Finish presentation<small>Work · 11:30 AM</small></span></div>
          <div className="phone-task"><i /><span>Read 20 pages<small>Personal · 2:00 PM</small></span></div>
          <div className="phone-tab-bar"><span>⌂<small>Today</small></span><span>▤<small>Tasks</small></span><span>◷<small>Plan</small></span><span>☻<small>Profile</small></span></div>
        </div>
      </div>
      <div className="download-phone phone-front">
        <div className="phone-screen">
          <div className="phone-status"><span>9:41</span><span>● ● ▰</span></div>
          <div className="phone-profile"><span>AM</span><small>YOUR WEEK</small></div>
          <h3>A little progress<br />every day.</h3>
          <div className="phone-progress-ring"><div><strong>75%</strong><small>complete</small></div></div>
          <div className="phone-week-label">THIS WEEK <b>+24%</b></div>
          <div className="phone-bars"><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="phone-week-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
          <div className="phone-streak"><span>✦</span><div><strong>You&apos;re on a roll</strong><small>4-day productivity streak</small></div></div>
          <div className="phone-tab-bar"><span>⌂<small>Today</small></span><span>▤<small>Tasks</small></span><span>◷<small>Plan</small></span><span>☻<small>Profile</small></span></div>
        </div>
      </div>
    </div>
  );
}

export default function GetStartedPage() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    setAppInstalled(window.matchMedia("(display-mode: standalone)").matches);

    function handleInstallPromptAvailable() {
      setInstallPrompt(window.taskflowDeferredInstallPrompt);
    }

    function handleAppInstalled() {
      window.taskflowDeferredInstallPrompt = null;
      setInstallPrompt(null);
      setAppInstalled(true);
      setShowInstallHelp(false);
    }

    setInstallPrompt(window.taskflowDeferredInstallPrompt);
    window.addEventListener("taskflowinstallprompt", handleInstallPromptAvailable);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("taskflowinstallprompt", handleInstallPromptAvailable);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleWindowsInstall() {
    if (!installPrompt) {
      setShowInstallHelp(true);
      window.open("/app?install=1", "_blank", "noopener,noreferrer");
      return;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    window.taskflowDeferredInstallPrompt = null;
    setInstallPrompt(null);
    if (outcome === "accepted") setAppInstalled(true);
  }

  return (
    <>
      <Header />
      <main className="getting-started-page">
        <div className="container getting-started-container">
          <a className="text-link getting-started-back" href="/#top">
            <span aria-hidden="true">←</span> Back to TaskFlow
          </a>

          <section className="getting-started-hero">
            <span className="eyebrow">
              <span className="eyebrow-dot"></span>
              A clearer day starts here
            </span>
            <h1>
              Make space for
              <br />
              <span>what matters.</span>
            </h1>
            <p>
              A few small steps can turn a busy list into a thoughtful plan.
              Explore how TaskFlow can help you get organized.
            </p>
            <a className="button button-primary" href="/#features">
              Explore the features <span aria-hidden="true">↗</span>
            </a>
          </section>

          <BetaCountdownSection />

          <section className="download-section" aria-labelledby="download-title">
            <PhonePreviews />
            <div className="download-intro">
              <span className="section-kicker">YOUR TASKFLOW, YOUR WAY</span>
              <h2 id="download-title">
                Choose where to <span>begin.</span>
              </h2>
              <p>
                Use TaskFlow in your browser, install the Windows desktop app,
                or download the Android version.
              </p>
            </div>
            <div className="download-options">
              <a className="download-option download-web" href="/app">
                <span className="download-option-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3.5" y="4.5" width="17" height="12" rx="2" />
                    <path d="M8 20h8M12 16.5V20" />
                  </svg>
                </span>
                <span className="download-option-copy">
                  <small>AVAILABLE NOW</small>
                  <strong>Web version</strong>
                </span>
                <span className="download-option-action">Open demo <b aria-hidden="true">↗</b></span>
              </a>
              <a
                className="download-option"
                href="https://github.com/itsiamdev/taskflow/releases/latest/download/taskflow.apk"
              >
                <span className="download-option-icon play-icon" aria-hidden="true">
                  <img src="/google-play.png" alt="" />
                </span>
                <span className="download-option-copy">
                  <small>ANDROID · APK</small>
                  <strong>Download TaskFlow</strong>
                </span>
                <span className="download-option-action">Download APK <b aria-hidden="true">↓</b></span>
              </a>
              <button
                className="download-option windows-install"
                type="button"
                onClick={handleWindowsInstall}
                aria-expanded={showInstallHelp}
                aria-controls="windows-install-help"
              >
                <span className="download-option-icon windows-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M2 5.2 10.1 4v7.1H2V5.2Zm9.3-1.4L22 2v9.1H11.3V3.8ZM2 12.2h8.1v7.1L2 18.1v-5.9Zm9.3 0H22v9.1l-10.7-1.8v-7.3Z" />
                  </svg>
                </span>
                <span className="download-option-copy">
                  <small>WINDOWS · DESKTOP</small>
                  <strong>{appInstalled ? "TaskFlow installed" : "TaskFlow for Windows"}</strong>
                </span>
                <span className="download-option-action">
                  {appInstalled ? "Installed" : "Install app"} <b aria-hidden="true">{appInstalled ? "✓" : "↓"}</b>
                </span>
              </button>
            </div>
            {showInstallHelp && (
              <p className="windows-install-help" id="windows-install-help" role="status">
                Open this page in Microsoft Edge or Chrome on Windows, then choose
                “Install TaskFlow” from the browser menu or install icon in the address bar.
              </p>
            )}
          </section>

          <section className="getting-started-steps" aria-labelledby="getting-started-title">
            <div className="getting-started-section-heading">
              <span className="section-kicker">A SIMPLE PLACE TO BEGIN</span>
              <h2 id="getting-started-title">
                Start with one <span>small step.</span>
              </h2>
              <p>Build a calmer routine, one task at a time.</p>
            </div>
            <div className="getting-started-step-grid">
              {steps.map((step) => (
                <article className="getting-started-step" key={step.number}>
                  <span className="getting-started-number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </section>

          <p className="getting-started-notice">
            The Android download is served from the latest GitHub Release and
            becomes available once its APK is published. Your tasks and habits
            are stored locally on your device.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
