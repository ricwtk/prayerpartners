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
    },
    acceptRequest: function () {
      if (DEBUG) console.log("acceptRequest");
      // send notification to accept
      sendAccept(this.user.userId);
      // check if friend is already in friend list
      if (!globalStore.savedData.friends.map(fri => fri.userId).includes(this.user.userId)) {
        // add friend to my friend list
        globalStore.savedData.friends.push(newFriend(this.user.userId, this.user.name));
      }
      // remove request from my friendrequests list
      this.removeRequest();
      updateToDatabase();
    },
    rejectRequest: function () {
      if (DEBUG) console.log("rejectRequest");
      this.removeRequest();
      updateToDatabase();
    },
    removeRequest: function () {
      if (DEBUG) console.log("removeRequest");
      // remove request from my friendrequests list
      let indexOfRequest = globalStore.savedData.friendRequests.findIndex(friend => friend.userId == this.user.userId);
      globalStore.savedData.friendRequests.splice(indexOfRequest, 1);
    },
    onClick: function () {
      this.$emit('click', this.user);
    }
  },
  template: `
  <div class="uda-container" @click="onClick">
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
            <template v-if="action == 'a'">
              <div v-if="globalStore.connectedFriends.includes(user.userId) || user.userId == globalStore.savedData.userId" 
                class="uda-button-disabled fa fa-users" 
                @click=""
                title="You are connected"></div>
              <div v-else
                class="uda-button fa fa-plus" 
                @click="addUser"
                title="Send friend request"></div>
            </template>
            <div v-if="action == 'c'" 
              class="uda-button fa fa-plus" 
              @click="acceptRequest"
              title="Accept friend request"></div>
            <div v-if="action == 'r'" 
              class="uda-button fa fa-times" 
              @click="rejectRequest"
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