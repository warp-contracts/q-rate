async function checkTabForFakeNews() {
  const data = await getContractData();
  const disputes = data.state.disputes;

  const fakeUrls = [];
  const pendingUrls = [];
  Object.keys(disputes).forEach((d) => {
    if (disputes[d].winningOption == "fake") {
      fakeUrls.push(disputes[d].id);
    } else if (disputes[d].winningOption == "") {
      pendingUrls.push(disputes[d].id);
    }
  });
  const isUrlFake = fakeUrls.some((url) =>
    document.location.href?.startsWith(url)
  );
  const isUrlPending = pendingUrls.some((url) =>
    document.location.href?.startsWith(url)
  );
  if (isUrlFake) {
    createWarningBox(true);
  } else if (isUrlPending) {
    createWarningBox(false);
  }
}

function createWarningBox(isFake) {
  let elemDiv = document.createElement("div");
  elemDiv.setAttribute("id", "warning");
  elemDiv.textContent = isFake
    ? "Be careful. Page you are viewing contains fake info."
    : "Be careful. Page you are viewing has been reported as fake and might contain fake info.";
  elemDiv.style.cssText = `position:fixed;width:270px;right:0;z-index:2147483647;background:${
    isFake ? "#FF0000" : "#FF8C00"
  };text-align:center;color:white;padding:0.25rem;font-family: Verdana, sans-serif;font-size: 14px;line-height: 20px;display: flex;`;

  let elem = document.createElement("img");
  elem.setAttribute(
    "src",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/OOjs_UI_icon_close-ltr.svg/1024px-OOjs_UI_icon_close-ltr.svg.png"
  );
  elem.style.cssText =
    "cursor: pointer;height: 20px;, width: 20px;padding-top: 0.25rem;";

  elemDiv.appendChild(elem);
  elem.addEventListener("click", removeWarning);

  document.body.insertBefore(elemDiv, document.body.firstChild);
}

function removeWarning() {
  document.getElementById("warning").remove();
}

async function getContractData() {
  const data = fetch(
    `https://cache.redstone.tools/cache/state/pvudp_Wp8NMDJR6KUsQbzJJ27oLO4fAKXsnVQn86JbU`
  ).then(async (res) => {
    const data = await res.json();
    return data;
  });
  return data;
}

checkTabForFakeNews();
