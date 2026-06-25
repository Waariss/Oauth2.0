function setValue(elementId, value) {
  document.getElementById(elementId).innerText = value || "Not found";
}

function setFindings(findings) {
  const findingsElement = document.getElementById("findings");
  findingsElement.innerHTML = "";

  if (!Array.isArray(findings) || findings.length === 0) {
    const item = document.createElement("li");
    item.innerText = "No findings yet.";
    findingsElement.appendChild(item);
    return;
  }

  for (const finding of findings) {
    const item = document.createElement("li");
    item.innerText = finding;
    findingsElement.appendChild(item);
  }
}

function setRiskBadge(assessment) {
  const badge = document.getElementById("riskBadge");
  const severity = assessment?.severity || "medium";
  const verdict = assessment?.verdict || "manual-review";
  badge.className = "risk-badge";
  badge.classList.add(
    severity === "low" ? "risk-low" : severity === "high" ? "risk-high" : "risk-medium"
  );
  badge.innerText = `Verdict: ${verdict}`;
}

function resetUi() {
  document.getElementById("status").innerText = "No OAuth parameters captured yet.";
  setRiskBadge({ verdict: "waiting for callback", severity: "medium" });
  setFindings([]);
  setValue("authCode", null);
  setValue("state", null);
  setValue("nonce", null);
  setValue("responseType", null);
  setValue("capturedUrl", null);
  setValue("requestUrl", null);
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["oauthLatestSession", "oauthCapture"], (data) => {
    const session = data.oauthLatestSession || data.oauthCapture;
    const callback = session?.callback || null;
    if (!session || !callback) {
      resetUi();
      return;
    }

    const capturedAt = new Date(callback.capturedAt);
    const capturedAtLabel = Number.isNaN(capturedAt.valueOf())
      ? "unknown time"
      : capturedAt.toLocaleString();

    document.getElementById("status").innerText =
      `Captured callback via ${callback.source || "unknown"} at ${capturedAtLabel}`;
    setRiskBadge(session.assessment);
    setFindings(session.assessment?.findings || []);
    setValue("authCode", callback.authCode);
    setValue("state", callback.state);
    setValue("nonce", callback.nonce);
    setValue("responseType", callback.responseType);
    setValue("capturedUrl", callback.url);
    setValue("requestUrl", session?.request?.url || null);
  });

  document.getElementById("removeCode").addEventListener("click", () => {
    chrome.storage.local.remove(
      ["oauthCapture", "oauthLatestSession", "oauthSessions", "oauthPendingRequest"],
      () => {
      resetUi();
      }
    );
  });
});
