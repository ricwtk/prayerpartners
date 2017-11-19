Vue.component("user-details-actions", {
  props: ['user', 'actions'],
  methods: {
    directToSocial: function () {
      window.open(this.user.profileLink, "_blank");
    },
    idpClass: function () {
      return {
        fa: true,
        "fa-google-plus-official": this.user.userId.startsWith("g"),
        "fa-facebook-official": this.user.userId.startsWith("fb")
      };
    },
  },
  template: `
  <div class="uda-container">
    <div class="uda-img"><img :src="user.profilePicture"></img></div>
    <div class="uda-list">
      <div class="uda-list-container">
        <div :title="user.name">
          {{ limitStr(user.name, 20) }} <i :class="idpClass"></i></i>
        </div>
        <div :title="user.email">
          {{ limitStr(user.email, 20) }}
        </div>
        <div class="uda-button fa fa-external-link" @click="directToSocial"></div>
        <div class="uda-button fa fa-plus" @click="directToSocial"></div>
      </div>
    </div>
  </div>
  `
})