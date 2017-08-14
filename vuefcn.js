var app = new Vue({
  el: '#main',
  data: {
    sectionStyle: {
      width: "40%",
      height: "200px"
    }
  }
});

var app2 = new Vue({
  el: '#menu',
  data: {
    widthOfSection: app.sectionStyle.width,
    heightOfSection: app.sectionStyle.height
  }
});

var inputSectionWidth = document.getElementById("input-section-width");
inputSectionWidth.value = app.sectionStyle.width.replace("%", "");
inputSectionWidth.addEventListener("change", () => {
  app.sectionStyle.width = inputSectionWidth.value + '%';
  app2.widthOfSection = app.sectionStyle.width;
});

var inputSectionHeight = document.getElementById("input-section-height");
inputSectionHeight.value = app.sectionStyle.height.replace("px", "");
inputSectionHeight.addEventListener("change", () => {
  app.sectionStyle.height = inputSectionHeight.value + 'px';
  app2.heightOfSection = app.sectionStyle.height;
});
// console.log("width", document.getElementById("input-section-width").value);
// console.log("height", document.getElementById("input-section-height").value);