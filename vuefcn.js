Vue.component('about-overlay', {
  methods: {
    closeThis: function() {
      this.$emit('close');
    }
  },
  template: `
    <div class="overlay decor-overlay">
      <div class="overlay-content">
        Prayer Partners<br>
        Developer: Richard Wong ricwtk@gmail.com<br>
        Source code: Github link<br>
        Use Github tracker or email me to report any issue or suggest any enhancement
        <br>
        <button type="button" @click="closeThis">Close</button>
      </div>
    </div>
  `
});

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
      var friendList = savedData.friends.map(friend => friend.name);
      if (friendList.includes(this.newFriendName)) {
        this.addPrivateError = true;
        showDebug([this.newFriendName + " is in existing friend list"]);
      } else {
        var friend = JSON.parse(JSON.stringify(newFriend));
        friend.friendId = generateId(savedData.friends.map(friend => friend.friendId));
        friend.name = this.newFriendName;
        savedData.friends.push(friend);
        this.newFriendName = '';
        this.showOverlay = false;
        showDebug(["Save '" + this.newFriendName + "' to friend list"]);
      }
      updateToDatabase();
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
        <div v-if="friendList.length == 0">Invite friends using emails to share prayer items.</div>
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

Vue.component('single-tag', {
  props: ["isChecked", "tag"],
  data: function() {
    return {}
  },
  methods: {
    toggleState: function() {
      this.$emit('change', {isChecked: !this.isChecked, tag: this.tag});
    }
  },
  template: `
    <span class="tag-item" :title="tag">
      <input type="checkbox" 
        :checked="isChecked" 
        @change="toggleState">
      <span class="tag-item-name">{{ tag }}</span>
    </span>
  `
});

Vue.component('add-tag-overlay', {
  props: ["item"],
  data: function() {
    return {
      newTags: "",
      // tagList: []
    };
  },
  computed: {
    tagList: function() {
      var tags = [];
      savedData.mine.items.forEach(item => {
        tags = tags.concat(item.tags.filter(tag => tags.indexOf(tag) < 0));
      });
      return tags;
    }
  },
  methods: {
    closeThis: function() {
      this.$emit('close');
    },
    updateTagList: function(detail) {
      if (detail.isChecked) {
        showDebug(["tag list: added '" + detail.tag + "'"]);
        this.item.tags.push(detail.tag);
      } else {
        showDebug(["tag list: removed '" + detail.tag + "'"]);
        var idx = this.item.tags.findIndex(x => (x == detail.tag));
        this.item.tags.splice(idx, 1);
      }
      this.item.edit = true;
      showDebug([copyObj(this.item)]);
    },
    addNewTag: function() {
      var newTags = this.newTags.split(',');
      newTags.forEach(tag => {
        this.updateTagList({ isChecked: true, tag: tag });
      });
    }
  },
  // created: function() {
  //   savedData.mine.items.forEach(item => {
  //     this.tagList = this.tagList.concat(item.tags.filter(tag => this.tagList.indexOf(tag) < 0));
  //   });
  //   this.tagList = copyObj(this.tagList);
  // },
  template: `
    <div class="overlay decor-overlay">
      <div class="overlay-wrapper">
        <div class="overlay-label">Tags:</div>
        <div class="overlay-row">
          <div class="overlay-label" title="Separate multiple tags by comma (,)">New tag(s): &nbsp;</div>
          <input class="overlay-input" type="text" v-model="newTags">
          <div class="overlay-actions">
            <button type="button" @click="addNewTag">Add</button>
          </div>
        </div>
        <div class="tags-content">
          <template v-for="tag in tagList">
            <single-tag 
              :isChecked="item.tags.includes(tag)" 
              :tag="tag"
              @change="updateTagList">
            </single-tag>
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
  props: ["item", "edit", "allowOrder", "editActions"],
  data: function () {
    return {
      showDesc: false,
      showShareWith: false,
      showEdit: false,
      showTagList: false
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
    },
    removeFromList: function() {
      this.$emit('removeFromList', this.item.itemId);
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
              <span v-else-if="action === 'r'" class="item-delete item-menu decor-itemmenu" title="Remove from list" @click="removeFromList">&#x2262;</span>
              <span v-else-if="action === 'd'" class="item-delete item-menu decor-itemmenu" title="Delete" @click="deleteItem">&#x1f7a8;</span>
              <span v-else-if="action === 's'" class="item-share item-menu decor-itemmenu" title="Share" @click="showShareWith=true">&#x21cc;</span>
              <span v-else-if="action === 't'" class="item-share item-menu decor-itemmenu" title="Tag" @click="showTagList=true">&#x1f516;</span>
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
      <add-tag-overlay 
        v-if="showTagList" 
        @close="showTagList=false"
        :item="item">
      </add-tag-overlay>
    </div>
  `
});

Vue.component('section-list', {
  props: ["sectionTooltip", "sectionTitle", "itemList", "sectionStyle", "sectionTypeData"],
  // sectionTypeData = { sType: "", data: null }
  data: function () {
    return {
      edit: false,
      showAddNewItem: false,
      clonedItemList: [],
      moving: null,
      showEditName: false
    }
  },
  computed: {
    allowOrder: function() { 
      switch(this.sectionTypeData.sType) {
        case "mine": case "friend": return true;
        case "archive": case "mine-friend": case "mine-tag": default: return false;
      }
    },
    editActions: function() {
      switch(this.sectionTypeData.sType) {
        case "mine": return ['e','a','d','s','t'];
        case "archive": return ['u','d'];
        case "mine-friend": 
          if (this.sectionTitle == 'Unshared') return ['e','a','d','s','t'];
          return ['e','a','d','s','t','r'];
        case "mine-tag": 
          if (this.sectionTitle == 'Untagged') return ['e','a','d','s','t'];
          return ['e','a','d','s','t','r'];
        case "friend": return ['e','d'];
        default: return [];
      }
    },
    allowNew: function() {
      switch(this.sectionTypeData.sType) {
        case "mine": case "friend": return true;
        case "mine-friend": case "mine-tag": case "archive": default: return false;
      }
    },
    allowRemove: function() {
      switch(this.sectionTypeData.sType) {
        case "friend":
          return (this.sectionTooltip == null);
        default: return false;
      }
    },
    allowEditName: function() {
      switch(this.sectionTypeData.sType) {
        case "friend":
          return true;
        default: return false;
      }
    },
    displayItemList: function() {
      var myList = this.clonedItemList.filter(item => !item.deleted);
      switch (this.sectionTypeData.sType) {
        case "mine-tag": 
          if (this.sectionTitle !== 'Untagged') 
            myList = myList.filter(item => item.tags.includes(this.sectionTitle));
          break;
        case "mine-friend":
          if (this.sectionTitle !== 'Unshared') 
            myList = myList.filter(item => item.sharedWith.includes(this.sectionTooltip));
          break;
        default: break;
      }
      switch (this.sectionTypeData.sType) {
        case "mine": case "mine-tag": case "mine-friend":
          return myList.filter(item => !item.archived);
        case "archive":
          return myList.filter(item => item.archived);
        default:
          return myList;
      }      
    },
  },
  watch: {
    'itemList': function() {
      this.syncClonedWithOri();
    }
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
    removeSection: function() {
      this.$emit("remove", this.sectionTypeData.data.friendId);
      this.edit = false;
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
      itemToEdit.order = -1;
      itemToEdit.tags = [];
      itemToEdit.sharedWith = [];
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
    removeFromList: function(itemId) {
      showDebug(["remove '" + itemId + "' from list"]);
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      if (this.sectionTypeData.sType == 'mine-friend') {
        var idx = itemToEdit.sharedWith.findIndex(x => (x == this.sectionTooltip));
        itemToEdit.sharedWith.splice(idx, 1);
      } else if (this.sectionTypeData.sType == 'mine-tag') {
        var idx = itemToEdit.tags.findIndex(x => (x == this.sectionTitle));
        itemToEdit.tags.splice(idx, 1);
      }
      showDebug([copyObj(itemToEdit)]);
      itemToEdit.edit = true;
    },
    createNew: function(newItem) {
      newItem.itemId = generateId(this.clonedItemList.map(item => item.itemId));
      newItem.order = Math.max(...this.clonedItemList.filter(item => (item.order > -1)).map(item => item.order)) + 1;
      if (newItem.order == -Infinity) newItem.order = 0;
      if (this.sectionTypeData.sType == "friend") {
        newItem.owner = "mine";
      }
      showDebug(["add item: ", copyObj(newItem)]);
      this.clonedItemList.splice(this.clonedItemList.length, 1, newItem);
    },
    saveEdit: function() {
      showDebug(["update list", copyObj(this.clonedItemList)]);
      var saveToItemList;
      switch (this.sectionTypeData.sType) {
        case "mine":
        case "archive":
        case "mine-tag":
        case "mine-friend":
          saveToItemList = savedData.mine.items;
          break;
        default:
          saveToItemList = this.itemList;
      }
      this.clonedItemList.forEach((item) => {
        if (item.edit) {
          var itemToEdit = this.findItemById(saveToItemList, item.itemId);
          if (itemToEdit == undefined) {
            var newItem;
            if (this.sectionTypeData.sType == 'friend') {
              newItem = copyObj(newFriendItem);
            } else {
              newItem = copyObj(newMineItem);
            }
            for (k in newItem) {
              this.$set(newItem, k, item[k]);
            }
            saveToItemList.splice(saveToItemList.length, 1, newItem);
          } else {
            if (item.deleted) {
              saveToItemList.splice(saveToItemList.findIndex(it => it.itemId == item.itemId), 1);
            } else {
              for (k in itemToEdit) {
                this.$set(itemToEdit, k, item[k]);
              }
            }
          }
        }
      });
      // reorder
      saveToItemList = saveToItemList.filter(item => !item.archived);
      saveToItemList.sort((a,b) => {
        if (a.order == -1 && b.order == -1)
          return 0;
        else if (a.order == -1)
          return 1;
        else if (b.order == -1)
          return -1;
        else
          return a.order - b.order;
      });
      saveToItemList.map((item, index) => {
        item.order = index;
      })
      updateToDatabase();
      this.edit = false;
    },
    cancelEdit: function() {
      this.edit = false;
      this.syncClonedWithOri();
    }
  },
  created: function() {
    this.syncClonedWithOri();
  },
  template: `
    <div class="section decor-section" v-bind:style="sectionStyle">
      <div class="section-head decor-sectionhead">
        <div class="section-action decor-sectionaction" v-if="edit && allowEditName">
          <span @click="showEditName = true" class="section-action-item decor-sectionactionitem" title="Edit name">&#x1f589;</span>
          <edit-name-overlay 
            v-if="showEditName" 
            :name="sectionTypeData.data.name" 
            @save="(name) => { sectionTypeData.data.name = name; }"
            @close="showEditName = false">
          </edit-name-overlay>
        </div>
        <div class="section-title decor-sectiontitle" v-bind:title="sectionTooltip">{{ sectionTitle }}</div>
        <div class="section-action decor-sectionaction">
          <template v-if="edit">
            <span v-if="allowRemove" @click="removeSection" class="section-action-item decor-sectionactionitem" title="Remove">&#x1f464;&#x2093;</span>
            <span @click="saveEdit" class="section-action-item decor-sectionactionitem" title="Update">&#x1f4be;</span>
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
            v-bind:edit-actions="item.owner ? ( (item.owner === 'friend') ? []: editActions) : editActions"
            @moveUp="moveUp"
            @moveDown="moveDown"
            @setArchived="setArchived"
            @setUnarchived="setUnarchived"
            @deleteItem="deleteItem"
            @removeFromList="removeFromList">
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
          :sectionType="sectionTypeData.sType"
          :item="[]">
        </edit-item-overlay>
      </div>
    </div>
  `
});

Vue.component("edit-name-overlay", {
  props: ["name"],
  data: function () {
    return {
      newName: ''
    };
  },
  created: function() {
    this.newName = this.name;
  },
  methods: {
    saveThis: function() {
      this.$emit("save", this.newName);
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
          <div class="overlay-label">Change display name from "{{ name }}" to &nbsp;</div>
          <input class="overlay-input" type="text" v-model="newName">
        </div>
        <div class="overlay-actions">
          <button type="button" @click="saveThis">&#x1f4be; Save</button>
          <button type="button" @click="closeThis">&#x21b6; Cancel</button>
        </div>
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
          <div class="overlay-label">Change display name from "{{ userName }}" to &nbsp;</div>
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
      showList: 'single',
      savedData: savedData
    },
    computed: {
      myItems: function() {
        var myitems = savedData.mine.items.filter(item => !item.archived);
        myitems.sort(function(a,b) {
          return a.order - b.order;
        })
        return myitems;
      },
      myArchived: function() {
        return savedData.mine.items.filter(item => item.archived);
      },
      mySharedWithList: function() {
        // var shareableFriends = savedData.friends.filter(friend => friend.email);
        var shareableFriends = savedData.friends;
        var allFriends = shareableFriends.map(friend => {
          return {
            name: friend.name, 
            email: friend.email, 
            items: savedData.mine.items.filter(item => (item.sharedWith.includes(friend.email)))};
        });
        showDebug(["allFriends", allFriends]);
        return allFriends;
      },
      myFriendList: function() {
        var allFriends = savedData.friends.map(friend => friend);
        allFriends.sort(function(a,b) {
          return a.name.localeCompare(b.name);
        })
        return allFriends;
      },
      myUnshared: function() {
        return savedData.mine.items.filter(item => (item.sharedWith.length == 0));
      },
      myTags: function() {
        var tags = [];
        savedData.mine.items.forEach(item => {
          tags = tags.concat(item.tags.filter(tag => tags.indexOf(tag) < 0));
        });
        var allTags = tags.map(tag => {
          return {
            name: tag,
            items: savedData.mine.items.filter(item => (item.tags.includes(tag)))
          };
        });
        showDebug(["allTags", copyObj(allTags)])
        return allTags;
      },
      myUntagged: function() {
        return savedData.mine.items.filter(item => (item.tags.length == 0));
      }
    },
    methods: {
      removeFriend: function(friendId) {
        var indexOfFriend = savedData.friends.findIndex((friend) => friend.friendId == friendId);
        showDebug(["remove '" + savedData.friends[indexOfFriend].name + "' (id: " + savedData.friends[indexOfFriend].friendId + ")"]);
        savedData.friends.splice(indexOfFriend, 1);
        updateToDatabase();
      },
    },
  });

  showDebug(['savedData', copyObj(savedData)]);

  app2 = new Vue({
    el: '#menu',
    data: {
      widthOfSection: app.sectionStyle.width,
      heightOfSection: app.sectionStyle.height,
      showEditProfile: false,
      showAbout: false
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
        updateToDatabase();
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