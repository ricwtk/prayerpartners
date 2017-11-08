Vue.component('section-list', {
  props: ["sectionTooltip", "sectionTitle", "itemList", "sectionTypeData"],
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
    sectionStyle: () => {
      return globalStore.savedData.ui.sectionStyle;
    },
    idpClass: function () {
      let user = this.sectionTypeData.data || { userId: "" };
      return {
        fa: true,
        "fa-google-plus-official": user.userId.startsWith("g"),
        "fa-facebook-official": user.userId.startsWith("fb")
      };
    },
    allowOrder: function () {
      switch (this.sectionTypeData.sType) {
        case "mine":
        case "friend":
          return true;
        case "archive":
        case "mine-friend":
        case "mine-tag":
        default:
          return false;
      }
    },
    editActions: function () {
      switch (this.sectionTypeData.sType) {
        case "mine":
          return ['e', 'a', 'd', 's', 't'];
        case "archive":
          return ['u', 'd'];
        case "mine-friend":
          if (this.sectionTitle == 'Unshared') return ['e', 'a', 'd', 's', 't'];
          return ['e', 'a', 'd', 's', 't', 'r'];
        case "mine-tag":
          if (this.sectionTitle == 'Untagged') return ['e', 'a', 'd', 's', 't'];
          return ['e', 'a', 'd', 's', 't', 'r'];
        case "friend":
          return ['e', 'd'];
        default:
          return [];
      }
    },
    allowNew: function () {
      switch (this.sectionTypeData.sType) {
        case "mine":
        case "friend":
          return true;
        case "mine-friend":
        case "mine-tag":
        case "archive":
        default:
          return false;
      }
    },
    allowRemove: function () {
      switch (this.sectionTypeData.sType) {
        case "friend":
          return (this.sectionTypeData.data.userId.startsWith("pri"));
        default:
          return false;
      }
    },
    allowEditName: function () {
      switch (this.sectionTypeData.sType) {
        case "friend":
          return (this.sectionTypeData.data.userId.startsWith("pri"));
        default:
          return false;
      }
    },
    displayItemList: function () {
      var myList = this.clonedItemList.filter(item => !item.deleted);
      switch (this.sectionTypeData.sType) {
        case "mine-tag":
          if (this.sectionTitle !== 'Untagged')
            myList = myList.filter(item => item.tags.includes(this.sectionTitle));
          break;
        case "mine-friend":
          if (this.sectionTitle !== 'Unshared')
            myList = myList.filter(item => item.sharedWith.includes(this.sectionTypeData.data.userId));
          break;
        default:
          break;
      }
      switch (this.sectionTypeData.sType) {
        case "mine":
        case "mine-tag":
        case "mine-friend":
          return myList.filter(item => !item.archived);
        case "archive":
          return myList.filter(item => item.archived);
        default:
          return myList;
      }
    },
  },
  watch: {
    'itemList': function () {
      this.syncClonedWithOri();
    }
  },
  methods: {
    findItemById: function (itemList, itemId) {
      return itemList.filter(item => (item.itemId == itemId))[0];
    },
    findItemByOrder: function (itemList, itemOrder) {
      return itemList.filter(item => (item.order == itemOrder))[0];
    },
    syncClonedWithOri: function () {
      // showDebug(["syncClonedWithOri", copyObj(this.itemList)]);
      this.clonedItemList = copyObj(this.itemList);
      this.clonedItemList = this.clonedItemList.map(item => {
        return Object.assign({}, item, {
          edit: false,
          deleted: false
        });
      });
      this.clonedItemList.sort(function (a, b) {
        return a.order - b.order;
      });
    },
    removeSection: function () {
      this.$emit("remove", this.sectionTypeData.data.friendId);
      this.edit = false;
    },
    moveUp: function (itemId) {
      showDebug(["move '" + itemId + "' up"]);
      var itemToMove = this.findItemById(this.itemList, itemId);
      if (itemToMove.order !== 0) {
        var itemToSwap = this.findItemByOrder(this.itemList, itemToMove.order - 1);
        itemToSwap.order += 1;
        itemToMove.order -= 1;
      }
      this.syncClonedWithOri();
    },
    moveDown: function (itemId) {
      showDebug(["move '" + itemId + "' down"]);
      var itemToMove = this.findItemById(this.itemList, itemId);
      var lastOrder = Math.max(...this.itemList.filter(item => (item.order > -1)).map(item => item.order));
      if (itemToMove.order !== lastOrder) {
        var itemToSwap = this.findItemByOrder(this.itemList, itemToMove.order + 1);
        itemToSwap.order -= 1;
        itemToMove.order += 1;
      }
      this.syncClonedWithOri();
    },
    setArchived: function (itemId) {
      showDebug(["archived '" + itemId + "'"]);
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      itemToEdit.archived = true;
      itemToEdit.edit = true;
      itemToEdit.order = -1;
      itemToEdit.tags = [];
      itemToEdit.sharedWith = [];
    },
    setUnarchived: function (itemId) {
      showDebug(["unarchived '" + itemId + "'"])
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      itemToEdit.archived = false;
      itemToEdit.edit = true;
    },
    deleteItem: function (itemId) {
      showDebug(["delete '" + itemId + "'"]);
      var itemToEdit = this.findItemById(this.clonedItemList, itemId);
      itemToEdit.deleted = true;
      itemToEdit.edit = true;
    },
    removeFromList: function (itemId) {
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
    createNew: function (newItem) {
      newItem.itemId = generateId(this.clonedItemList.map(item => item.itemId));
      newItem.order = Math.max(...this.clonedItemList.filter(item => (item.order > -1)).map(item => item.order)) + 1;
      if (newItem.order == -Infinity) newItem.order = 0;
      if (this.sectionTypeData.sType == "friend") {
        newItem.owner = "mine";
      }
      showDebug(["add item: ", copyObj(newItem)]);
      this.clonedItemList.splice(this.clonedItemList.length, 1, newItem);
    },
    saveEdit: function () {
      showDebug(["update list", copyObj(this.clonedItemList)]);
      var saveToItemList;
      switch (this.sectionTypeData.sType) {
        case "mine":
        case "archive":
        case "mine-tag":
        case "mine-friend":
          saveToItemList = globalStore.savedData.items;
          break;
        default:
          saveToItemList = this.itemList;
      }
      var friendsToUpdate = [];
      this.clonedItemList.forEach((item) => {
        if (item.edit) {
          var itemToEdit = this.findItemById(saveToItemList, item.itemId);
          if (itemToEdit == undefined) {
            var newItem;
            if (this.sectionTypeData.sType == 'friend') {
              newItem = newFriendItem();
            } else {
              newItem = newMineItem();
            }
            for (k in newItem) {
              if (k == "sharedWith") {
                friendsToUpdate.push(...item[k]);
              }
              this.$set(newItem, k, item[k]);
            }
            saveToItemList.splice(saveToItemList.length, 1, newItem);
          } else {
            if (item.deleted) {
              saveToItemList.splice(saveToItemList.findIndex(it => it.itemId == item.itemId), 1);
              friendsToUpdate.push(...item.sharedWith);
            } else {
              for (k in itemToEdit) {
                if (k == "sharedWith") {
                  friendsToUpdate.push(...itemToEdit[k]);
                  friendsToUpdate.push(...item[k]);
                }
                this.$set(itemToEdit, k, item[k]);
              }
            }
          }
        }
      });
      friendsToUpdate = [...new Set(friendsToUpdate)];
      // reorder
      saveToItemList = saveToItemList.filter(item => !item.archived);
      saveToItemList.sort((a, b) => {
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
      if (friendsToUpdate.length > 0) {
        updateAndSendSharedList(friendsToUpdate);
      }
      this.edit = false;
    },
    cancelEdit: function () {
      this.edit = false;
      this.syncClonedWithOri();
    }
  },
  created: function () {
    this.syncClonedWithOri();
  },
  template: `
    <div class="section decor-section" :style="sectionStyle">
      <div class="section-head decor-sectionhead">
        <div class="section-action decor-sectionaction" v-if="edit && allowEditName">
          <span @click="showEditName = true" class="section-action-item decor-sectionactionitem" title="Edit name"><i class="fa fa-pencil"></i></span>
          <edit-name-overlay 
            v-if="showEditName" 
            :name="sectionTypeData.data.name" 
            @save="(name) => { sectionTypeData.data.name = name; }"
            @close="showEditName = false">
          </edit-name-overlay>
        </div>
        <div class="section-title decor-sectiontitle" v-bind:title="sectionTooltip"><i :class=idpClass></i> {{ sectionTitle }}</div>
        <div class="section-action decor-sectionaction">
          <template v-if="edit">
            <span v-if="allowRemove" @click="removeSection" class="section-action-item decor-sectionactionitem" title="Remove"><i class="fa fa-user-times"></i></span>
            <span @click="saveEdit" class="section-action-item decor-sectionactionitem" title="Update"><i class="fa fa-save"></i></span>
            <span @click="cancelEdit" class="section-action-item decor-sectionactionitem" title="Cancel"><i class="fa fa-undo"></i></span>
          </template>
          <span v-else @click="edit=true" class="section-action-item decor-sectionactionitem" title="Edit"><i class="fa fa-pencil"></i></span>
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
          <div class="item-add-new item-menu decor-itemmenu" title="Add new prayer item" @click="showAddNewItem=true"><i class="fa fa-plus"></i></div>
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


Vue.component('share-with-overlay', {
  props: ["item"],
  computed: {
    friendList: function () {
      return globalStore.savedData.friends.filter(friend => (! friend.userId.startsWith("pri")));
    }
  },
  methods: {
    closeThis: function () {
      this.$emit('close');
    },
    updateShareWithList: function (detail) {
      if (detail.isChecked) {
        showDebug(["sharedWith list: added '" + detail.userId + "'"]);
        this.item.sharedWith.push(detail.userId);
      } else {
        showDebug(["sharedWith list: removed '" + detail.userId + "'"]);
        var idx = this.item.sharedWith.findIndex(x => (x == detail.userId));
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
              :isChecked="item.sharedWith.includes(friend.userId)" 
              :friend="friend"
              @change="updateShareWithList">
            </single-friend-to-share>
          </template>
        </div>
        <div class="overlay-actions">
          <button type="button" @click="closeThis"><i class="fa fa-times"></i> Close</button>
        </div>
      </div>
    </div>
  `
});


Vue.component('single-friend-to-share', {
  props: ["isChecked", "friend"],
  data: function () {
    return {}
  },
  methods: {
    toggleState: function () {
      this.$emit('change', {
        isChecked: !this.isChecked,
        userId: this.friend.userId
      });
    }
  },
  template: `
    <span class="friend-item" :title="friend.userId">
      <input type="checkbox" :checked="isChecked" @change="toggleState"><span class="friend-item-name">{{ friend.name }}</span>
    </span>
  `
});