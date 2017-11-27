Vue.component('add-new-friend-section', {
  props: [],
  data: function () {
    return {
      showOverlay: false,
      newFriendEmail: '',
      newFriendName: '',
      addPrivateError: false,
      addEmailError: false,
      searchFriendString: "",
      searchFriendList: []
    }
  },
  computed: {
    sectionStyle: () => {
      return globalStore.savedData.ui.sectionStyle;
    },
    searchFriendResults: function () {
      if (DEBUG) console.log("updated friend list", copyObj(this.searchFriendList));
      let result = [];
      if (this.searchFriendList.length < 1) {
        result.push("no search string");
      } else {
        if (DEBUG) console.log("searchFriendResults", copyObj(this.searchFriendList));
        this.searchFriendList.forEach((el, idx, arr) => {
          result.push([el.searchField, el.userId].join(" "));
        })
      }
      return result.join("<br>");
    }
  },
  watch: {
    "searchFriendString": function () {
      if (this.searchFriendString == "") {
        this.searchFriendList = [];
      } else {
        searchUsers(this.searchFriendString, this, "searchFriendList");
        // this.searchFriendString.split("").reverse().join("");
      }
    },
    "showOverlay": function () {
      if (this.showOverlay) {
        let el = this.$el;
        Vue.nextTick(() => this.$el.querySelector("#search-friend-input").focus());
        window.addEventListener("keyup", this.keyupListener);
      } else {
        window.removeEventListener("keyup", this.keyupListener);
      }
    }
  },
  methods: {
    addPrivate: function () {
      let friendList = globalStore.savedData.friends.map(friend => friend.name);
      let friendId = globalStore.savedData.friends.map(friend => friend.userId);
      addToFriend(generateId(friendId, "pri_"), this.searchFriendString);
      if (DEBUG) console.log("Save '" + this.searchFriendString + "' to friend list");
      showToast("added " + this.searchFriendString + " as a list");
      this.searchFriendString = "";
      this.exitOverlay();
      updateToDatabase();
    },
    addEmail: function () {
      let friendEmailList = globalStore.savedData.friends.map(friend => friend.email);
      let friendRequestList = globalStore.savedData.friendRequests.map(friReq => friReq.email);
      // if in friends list, notify and do not send invite
      if (friendEmailList.includes(this.newFriendEmail)) {
        this.addEmailError = true;
        if (DEBUG) console.log(this.newFriendEmail + " is in existing friend list");
        return null;
      }
      // else, if in friend requests list, send accept email, remove friend request, add to friends list
      if (friendRequestList.includes(this.newFriendEmail)) {
        sendAccept(this.newFriendEmail).then(() => {
          if (DEBUG) console.log("'" + this.newFriendEmail + "' is added to friend list");
          acceptFriendRequest(this.newFriendEmail);
          updateToDatabase();
        })
        return null;
      }
      // else, send invite email
      sendInvite(this.newFriendEmail).then(() => {
        if (DEBUG) console.log("Invite is sent to '" + this.newFriendEmail + "'");
        showToast("sent invite to " + this.newFriendEmail);
        this.newFriendEmail = '';
        this.exitOverlay();
      }, () => {
        this.addEmailError = true;
        showToast("error adding " + this.newFriendEmail);
        if (DEBUG) console.log("Error adding " + this.newFriendEmail);
      });
    },
    keyupListener: function (e) {
      if (e.keyCode == 27) this.exitOverlay(); // escape
    },
    exitOverlay: function () {
      this.showOverlay = false;
      this.searchFriendString = "";
    }
  },
  template: `
    <div class="section decor-section section-add-new-wrapper" v-bind:style="sectionStyle">
      <div class="section-add-new item-menu decor-itemmenu" title="Add new prayer list for a friend" @click="showOverlay=true">
        <div class="section-add-new-text"><i class="fa fa-plus"></i></div>
      </div>
      <div v-if="showOverlay" class="overlay decor-overlay">
        <div class="overlay-wrapper" id="search-friend-overlay">
          <div class="sep"></div>
          <div class="overlay-row">
            <div class="overlay-label">Add friend</div>
            <div class="horizontal-sep"></div>
            <input class="overlay-input" type="text" v-model="searchFriendString" id="search-friend-input">
            <div class="horizontal-sep"></div>
            <button type="button" @click="addPrivate">Add local</button>
          </div>
          <div class="sep"></div>
          <div class="overlay-row" id="search-friend-list">
            <div v-if="searchFriendList.length < 1">
            No search string
            </div>
            <div v-else v-for="user in searchFriendList" class="user-search-wrapper">
              <user-details-actions 
                :user="user" 
                actions="la" 
                pPicStyle="width: 70px">
              </user-details-actions>
            </div>
          </div>
          <div class="sep"></div>
          <button type="button" @click="exitOverlay" style="width:100%"><i class="fa fa-times"></i> Close</button>
          <div class="sep"></div>
        </div>
      </div>
    </div>
  `
});