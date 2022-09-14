window.onload = function () {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  // Replace Domain Placeholder with dynamic parameter 'domain'
  const domain = params.domain;
  if (domain != null) {
    var html = document.querySelector("html");
    var walker = document.createTreeWalker(html, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      node.nodeValue = node.nodeValue.replace(/<DOMAIN_NAME>/, domain);
    }
  }

  // Hide Chapters by parameter 'hidechapters'
  const chapters = params.hidechapters;
  if (domain != null) {
    const chaptersArray = chapters.split(":");
    var ul = document.querySelector('[class="topics"]');
    var items = ul.getElementsByTagName("li");

    for (var i = 0, item; (item = items[i]); ++i) {
      if (chaptersArray.includes(i.toString())) {
        item.remove();
      }
    }
  }
};
