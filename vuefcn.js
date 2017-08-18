Vue.component('add-new-friend-section', {
  props: ["sectionStyle"],
  data: function() {
    return {
      showOverlay: false,
      newFriendEmail: '',
      newFriendName: '',
      addPrivateError: false,
      addEmailError: false
    }
  },
  methods: {
    addPrivate: function() {
      var friendList = app.savedData.friends.map(friend => friend.name);
      if (friendList.includes(this.newFriendName)) {
        this.addPrivateError = true;
        showDebug([this.newFriendName + " is in existing friend list"]);
      } else {
        var friend = JSON.parse(JSON.stringify(newFriend));
        friend.friendId = generateId(app.savedData.friends.map(friend => friend.friendId));
        friend.name = this.newFriendName;
        app.savedData.friends.push(friend);
        this.newFriendName = '';
        this.showOverlay = false;
        showDebug(["Save '" + this.newFriendName + "' to friend list"]);
      }
    },
    addEmail: function() {
      var friendEmailList = app.savedData.friends.map(friend => friend.email);
      if (friendEmailList.includes(this.newFriendEmail)) {
        this.addEmailError = true;
        showDebug([this.newFriendName + " is in existing friend list"]);
      } else {
        // send invite
        this.newFriendEmail = '';
        this.showOverlay = false;
        showDebug(["Save '" + this.newFriendName + "' to friend list"]);
      }
    }
  },
  template: `
    <div class="section decor-section section-add-new-wrapper" v-bind:style="sectionStyle">
      <div class="section-add-new item-menu decor-itemmenu" title="Add new prayer list for a friend" @click="showOverlay=true">
        <div class="section-add-new-text">&#x1f7a1;</div>
      </div>
      <div v-if="showOverlay" class="overlay decor-overlay">
        <div class="overlay-wrapper">
          <div class="overlay-label">Invite with email (only Google account is supported, require response)</div>
          <div class="overlay-row">
            <input class="overlay-input" type="text" v-model="newFriendEmail">
            <button type="button" @click="addEmail">Invite</button>
          </div>
          <div v-if="addEmailError" class="overlay-error decor-overlayerror">Friend is already in the list. Change email.</div>
          <div class="overlay-label">Add private list for friend</div>
          <div class="overlay-row">
            <input class="overlay-input" type="text" v-model="newFriendName">
            <button type="button" @click="addPrivate">Add</button>
          </div>
          <div v-if="addPrivateError" class="overlay-error decor-overlayerror">Friend's name exists. Change name.</div>
          <div class="overlay-actions">
            <button type="button" @click="showOverlay=false">&#x21b6; Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `
});

Vue.component('edit-item-overlay', {
  props: ["item", "action", "sectionType"],// action = [new, edit]
  data: function() {
    return {
      newItem: null,
      newItemTitle: "",
      newItemDesc: "",
      edited: false
    }
  },
  created: function() {
    if (this.action == "new") {
      if (this.sectionType == "mine") {
        this.newItem = copyObj(newMineItem);
      } else { // if (this.sectionType == "friend")
        this.newItem = copyObj(newFriendItem);
      }
      this.newItem = Object.assign({}, this.newItem, { edit: false, deleted: false });
    } else {
      this.newItemTitle = this.item.item;
      this.newItemDesc = this.item.desc;
    }
  },
  methods: {
    saveThis: function() {
      if (this.action == "new") {
        this.newItem.item = this.newItemTitle;
        this.newItem.desc = this.newItemDesc;
        this.newItem.edit = true;
        this.$emit('createNew', this.newItem);
      } else {
        this.item.item = this.newItemTitle;
        this.item.desc = this.newItemDesc;
        this.item.edit = true;
      }
      this.closeThis();
      showDebug([copyObj(app.savedData)]);
    },
    closeThis: function() {
      this.$emit('close');
    }
  },
  template: `
    <div class="edit-item-overlay decor-edititemoverlay">
      <div class="edit-item-wrapper">
        <div class="edit-item-overlay-label">Prayer item:</div>
        <input class="edit-item-title" type="text" v-bind:value="item.item ? item.item:''" v-model="newItemTitle">
        <div class="edit-item-overlay-label">Long description:</div>
        <textarea class="edit-item-content" rows="10" v-model="newItemDesc">{{ item.desc ? item.desc:'' }}</textarea>
        <div class="edit-item-overlay-actions">
          <button type="button" @click="saveThis">&#x1f4be; Save</button>
          <button type="button" @click="closeThis">&#x21b6; Cancel</button>
        </div>
      </div>
    </div>
  `
});

Vue.component('single-friend-to-share', {
  props: ["isChecked", "friend"],
  data: function() {
    return {}
  },
  methods: {
    toggleState: function() {
      this.$emit('change', {isChecked: !this.isChecked, friendEmail: this.friend.email});
    }
  },
  template: `
    <span class="friend-item" :title="friend.email">
      <input type="checkbox" :checked="isChecked" @change="toggleState"><span class="friend-item-name">{{ friend.name }}</span>
    </span>
  `
});

Vue.component('share-with-overlay', {
  props: ["item"],
  computed: {
    friendList: function() {
      return app.savedData.friends.filter(friend => (friend.email !== null));
    }
  },
  methods: {
    closeThis: function() {
      this.$emit('close');
    },
    updateShareWithList: function(detail) {
      if (detail.isChecked) {
        showDebug(["sharedWith list: added '" + detail.friendEmail + "'"]);
        this.item.sharedWith.push(detail.friendEmail);
      } else {
        showDebug(["sharedWith list: removed '" + detail.friendEmail + "'"]);
        var idx = this.item.sharedWith.findIndex(x => (x == detail.friendEmail));
        this.item.sharedWith.splice(idx, 1);
      }
      this.item.edit = true;
    }
  },
  template: `
    <div class="overlay decor-overlay">
      <div class="overlay-wrapper">
        <div class="overlay-label">Friends:</div>
        <div class="share-with-content">
          <template v-for="friend in friendList">
            <single-friend-to-share 
              :isChecked="item.sharedWith.includes(friend.email)" 
              :friend="friend"
              @change="updateShareWithList">
            </single-friend-to-share>
          </template>
        </div>
        <div class="overlay-actions">
          <button type="button" @click="closeThis">&#x1f7a8; Close</button>
        </div>
      </div>
    </div>
  `
});

Vue.component('single-item', {
  props: ["item", "edit", "allowOrder", "editActions", "friendList"],
  data: function () {
    return {
      showDesc: false,
      showShareWith: false,
      showEdit: false
    }
  },
  methods: {
    toggleDesc: function() {
      this.showDesc = !this.showDesc;
    },
    moveUp: function() {
      this.$emit('moveUp', this.item.itemId);
    },
    moveDown: function() {
      this.$emit('moveDown', this.item.itemId);
    },
    setArchived: function() {
      this.$emit('setArchived', this.item.itemId);
    },
    setUnarchived: function() {
      this.$emit('setUnarchived', this.item.itemId);
    },
    deleteItem: function() {
      this.$emit('deleteItem', this.item.itemId);
    }
  },
  template: `
    <div class="item">
      <div class="item-head">
        <span class="item-short-desc" @click="toggleDesc">{{ item.item }}</span>
        <span class="item-actions">
          <template v-if="edit">
            <template v-for="action in editActions">
              <span v-if="action === 'e'" class="item-archive item-menu decor-itemmenu" title="Edit" @click="showEdit=true">&#x1f589;</span>
              <span v-else-if="action === 'u'" class="item-archive item-menu decor-itemmenu" title="Unarchive" @click="setUnarchived">&#x21a9;</span>
              <span v-else-if="action === 'a'" class="item-archive item-menu decor-itemmenu" title="Archive" @click="setArchived">&#x21aa;</span>
              <span v-else-if="action === 'r'" class="item-delete item-menu decor-itemmenu" title="Remove from list">&#x2262;</span>
              <span v-else-if="action === 'd'" class="item-delete item-menu decor-itemmenu" title="Delete" @click="deleteItem">&#x1f7a8;</span>
              <span v-else-if="action === 's'" class="item-share item-menu decor-itemmenu" title="Share" @click="showShareWith=true">&#x21cc;</span>
            </template>
          </template>
          <template v-else-if="allowOrder">
            <span class="item-archive item-menu decor-itemmenu" title="Up" @click="moveUp">&#x25b2;</span>
            <span class="item-delete item-menu decor-itemmenu" title="Down" @click="moveDown">&#x25bc;</span>
          </template>
        </span>
      </div>
      <div v-if="showDesc" class="item-long-desc">{{ item.desc }}</div>
      <edit-item-overlay 
        v-if="showEdit" 
        action="edit"
        :item="item"
        sectionType=""
        @close="showEdit=false">
      </edit-item-overlay>
      <share-with-overlay 
        v-if="showShareWith" 
        @close="showShareWith=false"
        :item="item">
      </share-with-overlay>
    </div>
  `
});

Vue.component('section-list', {
  props: ["sectionTooltip", "sectionTitle", "itemList", "sectionStyle", "sectionType", "friendList"],
  data: function () {
    return {
      edit: false,
      OWNER: OWNER,
      showAddNewItem: false,
      clonedItemList: [],
      moving: null
    }
  },
  computed: {
    allowOrder: function() { 
      switch(this.sectionType) {
        case "mine": case "friend": return true;
        case "archive": case "mine-friend": default: return false;
      }
    },
    editActions: function() {
      switch(this.sectionType) {
        case "mine": return ['e','a','d','s'];
        case "archive": return ['u','d'];
        case "mine-friend": return ['e','a','r','d','s'];
        case "friend": return ['e','d'];
        default: return [];
      }
    },
    allowNew: function() {
      switch(this.sectionType) {
        case "mine": case "friend": return true;
        case "mine-friend": case "archive": default: return false;
      }
    },
    displayItemList: function() {
      return this.clonedItemList.filter(item => (!item.archived && !item.deleted));
    },
  },
  methods: {
    findItemById: function(itemList, itemId) {
      return itemList.filter(item => (item.itemId == itemId))[0];
    },
    findItemByOrder: function(itemList, itemOrder) {
      return itemList.filter(item => (item.order == itemOrder))[0];
    },
    syncClonedWithOri: function() {
      showDebug(["syncClonedWithOri", copyObj(this.itemList)]);
      this.clonedItemList = copyObj(this.itemList);
      this.clonedItemList = this.clonedItemList.map(item => {
        return Object.assign({}, item, { edit: false, deleted: false });
      });
      this.clonedItemList.sort(function(a,b) {
        return a.order - b.order;
      });
    },
    extractDisplayList: function() {
      this.displayItemList = this.clonedItemList.filter(item => !item.archived);
      showDebug([copyObj(this.displayItemList)]);
    },
    cancelEdit: function() {
      this.edit = false;
      this.syncClonedWithOri();
    },
    moveUp: function(itemId) {
      showDebug(["move '" + itemId + "' up"]);
      var itemToMove = this.findItemById(this.itemList, itemId);
      if (itemToMove.order !== 0) {
        var itemToSwap = this.findItemByOrder(this.itemList, itemToMove.order-1);
        itemToSwap.order += 1;
        itemToMove.order -= 1;
      }
      this.syncClonedWithOri();
    },
    moveDown: function(itemId) {
      showDebug(["move '" + itemId + "' down"]);
      var itemToMove = this.findItemById(this.itemList, itemId);
      var lastOrder = Math.max(...this.itemList.filter(item => (item.order > -1)).map(item => item.order));
      if (itemToMove.order !== lastOrder) {
        var itemToSwap = this.findItemByOrder(this.itemList, itemToMove.order+1);
        itemToSwap.order -= 1;
        itemToMove.order += 1;
      }
      this.syncClonedWithOri();
    },
    setArchived: function(itemId) {
      showDebug(["archived '" + itemId + "'"]);
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      itemToEdit.archived = true;
      itemToEdit.edit = true;
    },
    setUnarchived: function(itemId) {
      showDebug(["unarchived '" + itemId + "'"])
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      itemToEdit.archived = false;
      itemToEdit.edit = true;
    },
    deleteItem: function(itemId) {
      showDebug(["delete '" + itemId + "'"]);
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      itemToEdit.deleted = true;
      itemToEdit.edit = true;
    },
    createNew: function(newItem) {
      showDebug(["add item: ", copyObj(newItem)]);
      newItem.itemId = generateId(this.itemList.map(item => item.itemId));
      newItem.order = Math.max(...this.itemList.filter(item => (item.order > -1)).map(item => item.order)) + 1;
      if (this.sectionType == "friend") {
        newItem.owner = OWNER.MINE;
      }
      this.itemList.splice(this.itemList.length, 1, newItem);
      this.syncClonedWithOri();
    }
  },
  created: function() {
    this.syncClonedWithOri();
  },
  template: `
    <div class="section decor-section" v-bind:style="sectionStyle">
      <div class="section-head decor-sectionhead">
        <div class="section-title decor-sectiontitle" v-bind:title="sectionTooltip">{{ sectionTitle }}</div>
        <div class="section-action decor-sectionaction">
          <template v-if="edit">
            <span @click="edit=false" class="section-action-item decor-sectionactionitem" title="Update">&#x1f4be;</span>
            <span @click="cancelEdit" class="section-action-item decor-sectionactionitem" title="Cancel">&#x21b6;</span>
          </template>
          <span v-else @click="edit=true" class="section-action-item decor-sectionactionitem" title="Edit">&#x1f589;</span>
        </div>
      </div>
      <div class="section-content decor-sectioncontent">
        <template v-for="item in displayItemList">
          <single-item 
            v-bind:item="item"
            v-bind:edit="edit"
            v-bind:allow-order="allowOrder"
            v-bind:edit-actions="item.owner ? ( (item.owner === OWNER.FRIEND) ? []: editActions) : editActions"
            v-bind:friendList="friendList"
            @moveUp="moveUp"
            @moveDown="moveDown"
            @setArchived="setArchived"
            @setUnarchived="setUnarchived"
            @deleteItem="deleteItem">
          </single-item>
        </template>        
        <div v-if="allowNew && edit" class="item">
          <div class="item-add-new item-menu decor-itemmenu" title="Add new prayer item" @click="showAddNewItem=true">&#x1f7a1;</div>
        </div>
        <edit-item-overlay 
          v-if="showAddNewItem" 
          @close="showAddNewItem=false" 
          @createNew="createNew"
          action="new"
          :sectionType="sectionType"
          :item="[]">
        </edit-item-overlay>
      </div>
    </div>
  `
});

Vue.component("edit-profile-overlay", {
  data: function () {
    return {
      newUserName: ''
    };
  },
  computed: {
    userName: function () {
      return savedData.mine.name;
    }
  },
  created: function() {
    this.newUserName = savedData.mine.name;
  },
  methods: {
    saveThis: function() {
      this.$emit("save", this.newUserName);
      this.closeThis();
    },
    closeThis: function() {
      this.$emit("close");
    }
  },
  template: `
    <div class="overlay decor-overlay">
      <div class="overlay-wrapper">
        <div class="overlay-row">
          <div class="overlay-label">Change display name from "{{ userName }}" to  </div>
          <input class="overlay-input" type="text" v-model="newUserName">
        </div>
        <div class="overlay-actions">
          <button type="button" @click="saveThis">&#x1f4be; Save</button>
          <button type="button" @click="closeThis">&#x21b6; Cancel</button>
        </div>
      </div>
    </div>
  `
});


var app, app2;
function initVueInst() {
  app = new Vue({
    el: '#main',
    data: {
      sectionStyle: {
        width: "40%",
        height: "200px"
      },
      savedData: savedData,
      showAsSingleList: true,
    },
    computed: {
      myItems: function() {
        var myitems = this.savedData.mine.items.filter(item => !item.archived);
        myitems.sort(function(a,b) {
          return a.order - b.order;
        })
        return myitems;
      },
      myArchived: function() {
        return this.savedData.mine.items.filter(item => item.archived);
      },
      mySharedWithList: function() {
        var allFriends = this.savedData.friends.map(friend => {
          return {
            name: friend.name, 
            email: friend.email, 
            items: this.savedData.mine.items.filter(item => (item.sharedWith.includes(friend.email)))};
        });
        console.log("allFriends", allFriends);
        return allFriends;
      }
    }
  });

  showDebug(['savedData', copyObj(savedData), 'app.savedData', copyObj(app.savedData)]);

  app2 = new Vue({
    el: '#menu',
    data: {
      widthOfSection: app.sectionStyle.width,
      heightOfSection: app.sectionStyle.height,
      showEditProfile: false
    },
    computed: {
      userName: () => {
        return savedData.mine.name;
      },
      userEmail: () => {
        return savedData.mine.email;
      }
    },
    methods: {
      saveProfile: function(newProfileName) {
        savedData.mine.name = newProfileName;
        updateToDatabase(savedData);
      }
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
}