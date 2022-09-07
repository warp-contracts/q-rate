async function checkTabForFakeNews() {
  const data = await getContractData();
  const disputes = new Map(Object.entries(data.state.disputes));
  const disputeArr = Array.from(disputes, ([key, value]) => ({ key, value }));

  const fakeUrls = [];
  disputeArr.forEach((d) => {
    if ((d.value.winningOption = "fake")) {
      fakeUrls.push(d.key);
    }
  });
  const isUrlFake = fakeUrls.some((url) =>
    document.location.href?.startsWith(url)
  );

  if (isUrlFake) {
    createWarningBox();
  }
}

function createWarningBox() {
  let elemDiv = document.createElement("div");
  elemDiv.setAttribute("id", "warning");
  elemDiv.textContent =
    "Be careful. Page you are viewing might contain fake info.";
  elemDiv.style.cssText =
    "position:fixed;width:270px;right:0;z-index:2147483647;background:red;text-align:center;color:white;padding:0.25rem;font-family: Verdana, sans-serif;font-size: 14px;line-height: 20px;display: flex;";

  let elem = document.createElement("img");
  elem.setAttribute(
    "src",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/OOjs_UI_icon_close-ltr.svg/1024px-OOjs_UI_icon_close-ltr.svg.png"
  );
  elem.setAttribute("height", "20");
  elem.setAttribute("width", "20");
  elem.style.cssText = "cursor: pointer;";

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
