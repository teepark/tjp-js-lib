(function() {
  document.getElementById("load_time").innerHTML =
    ((new Date()).getTime() - window.started) + "ms since start";

  var i, tag, br, tags = document.getElementsByTagName("a");
  for (i = 0; i < tags.length; i++) {
    tag = tags[i];
    if (tag.href.split("/").slice(-1)[0] === 
        document.location.href.split("/").slice(-1)[0]) {
      if (tag.nextSibling.nodeType === 1 &&
          tag.nextSibling.tagName.toLowerCase() === "br")
        tag.parentNode.removeChild(tag.nextSibling);
      tag.parentNode.removeChild(tag);
    }
  }
})();
