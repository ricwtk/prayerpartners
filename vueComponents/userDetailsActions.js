Vue.component("user-details-actions", {
  props: ['user', 'actions', 'pPicStyle'],
  computed: {
    idpClass: function () {
      return {
        fa: true,
        "fa-google-plus-official": this.user.userId.startsWith("g"),
        "fa-facebook-official": this.user.userId.startsWith("fb")
      };
    }
  },
  methods: {
    directToSocial: function () {
      window.open(this.user.profileLink, "_blank");
    },
    signOut: function () {
      logout();
    },
    addUser: function () {
      sendRequest(this.user.userId);
      showToast("Sent friend request to " + this.user.name);
    }
  },
  template: `
  <div class="uda-container">
    <div class="uda-img" :style="pPicStyle">
      <img :src="user.profilePicture"></img>
      <div class="uda-idp-overlay"><i :class="idpClass"></i></div>
    </div>
    <div class="uda-list">
      <div class="uda-list-container">
        <div :title="user.name">
          {{ limitStr(user.name, 20) }} <i :class="idpClass"></i></i>
        </div>
        <div :title="user.email" class="uda-email">
          {{ limitStr(user.email, 20) }}
        </div>
        <div class="uda-actions">
          <template v-for="(action, index) in actions">
            <div v-if="action == 'l'" 
              class="uda-button fa fa-external-link" 
              @click="directToSocial"
              title="Open social profile"></div>
            <div v-if="action == 'a'" 
              class="uda-button fa fa-plus" 
              @click="addUser"
              title="Send friend request"></div>
            <div v-if="action == 'c'" 
              class="uda-button fa fa-plus" 
              @click=""
              title="Accept friend request"></div>
            <div v-if="action == 'r'" 
              class="uda-button fa fa-times" 
              @click=""
              title="Reject friend request"></div>
            <div v-if="action == 'o'" 
              class="uda-button fa fa-sign-out" 
              @click="signOut"
              title="Sign out"></div>
          </template>
        </div>
      </div>
    </div>
  </div>
  `
})