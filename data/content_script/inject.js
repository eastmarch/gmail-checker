var observer;

function init() {
  var target = document.querySelector('head > title');

  observer = new window.MutationObserver(
    function(mutations) {
      mutations.forEach(
        function(mutation){
          notify(mutation.target.textContent, true);
        }
      );
    }
  );

  observer.observe(target, { subtree: true, characterData: true, childList: true });
}

function notify(title, changed) {
  try {
    if (title.includes('Inbox')) {
      chrome.runtime.sendMessage({"path": "page-to-background", "method": "alarm", "data": null})
    }
  } catch(e) {
    console.log("Content script could not communicate with parent extension");
    observer.disconnect();
  }
}

document.onreadystatechange = function () {
  if (document.readyState === 'complete') {
    init();
  }
}