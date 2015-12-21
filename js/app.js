

//var url = 'http://54.93.181.197:7676/'; // production
var url = 'http://192.168.178.21:7676/'; // localhost (Wingerdweg 107-I)

// components
var Items = {};

// model
Items.Model = function (data) {

  data = data || {};
  this.isRoot = m.prop(data.isRoot);
  this.uid = m.prop(data.uid);
  this.parentUId = m.prop(data.parentUId);
  this.parent = m.prop(data.parent);
  this.order = m.prop(data.order);
  this.name = m.prop(data.name);
  this.text = m.prop(data.text);
  this.children = m.prop([]);
  if (data.children) {
    data.children.forEach(function (data) {
      var model, vm;
      data.parent = this;
      data.parentUId = this.uid();
      model = new Items.Model(data);
      vm = new Items.ViewModel(model);
      this.children().push(vm);
    }.bind(this));
  }
};
Items.Model.prototype.getAfter = function () {
  var ret = 0;
  if (this.children() && this.children().length) {
    ret = Math.max.apply(Math, this.children().map(function (child) {
      if (!child.model().order()) {
        return 0;
      }
      return child.model().order();
    })) + 1;
  }
  return ret;
};
Items.Model.prototype.del = function () {

  // @TODO: Allow deletion before server responded a save call
  if (!this.uid()) return;

  this.parent().removeChild(this.uid());

  return m.request({
    method: 'DELETE',
    url: url + 'nodes/' + this.uid()
  });
};
Items.Model.prototype.save = function () {

  var method, data = {};

  if (!this.uid()) {
    method = 'POST';
    data.parentUId = this.parentUId();
  } else {
    method = 'PUT';
    data.uid = this.uid();
  }
  data.order = this.order();
  data.text = this.text;

  return m.request({
    method: method,
    url: url + 'nodes/',
    data: data
  }).then(function (response) {
    // @TODO: Not necessary for PUT
    this.uid(response.uid);
  }.bind(this));
};
Items.Model.prototype.createChild = function (text) {
  var child = new Items.Model({
    parent: this,
    parentUId: this.uid(),
    order: this.getAfter(),
    text: text
  });
  var vm = new Items.ViewModel(child);
  this.children().push(vm);
  return child.save();
};
Items.Model.prototype.removeChild = function (uid) {
  this.children().forEach(function (vm, index) {
    if (vm.model().uid() === uid) {
      this.children().splice(index, 1);
    }
  }.bind(this));
};
Items.Model.prototype.getNextOrder = function () {

  // @TODO: check for this.order()

  // guard against empty parent or children
  // length <= 1 because child will count for itself
  if (!this.parent() || !this.parent().children() || this.parent().children().length <= 1) {
    // child does not exist
    return this.order() + 1;
  }

  var isNext = false;
  var nextSibling;
  this.parent().children().forEach(function (child) {
    if (isNext && !nextSibling) {
      nextSibling = child.model();
    }
    if (child.model().uid() === this.uid()) {
      isNext = true;
    }
  }.bind(this));

  // this is last child
  if (!nextSibling) {
    return this.order() + 1;
  }

  // return value between this and next order
  return this.order() + (nextSibling.order() - this.order()) / 2;
};

// controller
Items.Controller = function () {
  m.request({
    method: 'GET',
    url: url + 'nodes'
  }).then(function (response) {
    response.isRoot = true;
    var model = new Items.Model(response);
    this.vm = new Items.ViewModel(model);
  }.bind(this));
};

// views
Items.View = {};
Items.View.Root = function (ctrl) {
  return [
    m('div', {className: 'wrapper'}, [
      m('h1', ctrl.vm.model().name()),
      Items.View.Children(ctrl.vm)
    ])
  ];
};
Items.View.Children = function (vm) {
  return  m('ul', {className: vm.showChildren() ? 'show-children' : ''}, [
    vm.model().children().map(Items.View.Item),
    m('li', Items.View.FormAdd(vm))
  ]);
};
Items.View.Item = function (vm) {
  return m('li', [
    m('div.item', {
      class: [
        vm.isEditing() ? 'is-editing ' : '',
        vm.dragOver() ? 'is-drag-over ' : ''
      ].join(' '),
      draggable: true,
      config: function (element, isInitialized) {
        if (isInitialized) return;
        element.addEventListener('dragstart', vm.ondragstart.bind(vm), false);
        // required to allow drop
        element.addEventListener('dragover', function (event) { event.preventDefault(); }, false);
        element.addEventListener('dragenter', vm.ondragenter.bind(vm), false);
        element.addEventListener('dragleave', vm.ondragleave.bind(vm), false);
        element.addEventListener('dragend', vm.ondragend.bind(vm), false);
        element.addEventListener('drop', vm.ondrop.bind(vm), false);
      }
    }, [
      m('button.delete', {onclick: vm.del.bind(vm)}, 'X'),
      m('button.edit', {onclick: vm.edit.bind(vm)}, 'E'),
      m('span.content', {onclick: vm.toggle.bind(vm)}, vm.model().text()),
      Items.View.FormEdit(vm)
    ]),
    Items.View.Children(vm)
  ]);
};
Items.View.FormAdd = function (vm) {
  return m('form', {onsubmit: vm.add.bind(vm)}, [
    m('input[type=submit]', {value: '+'}),
    m('span', m('input[type=text]', {onchange: m.withAttr('value', vm.val), value: vm.val()}))
  ]);
};
Items.View.FormEdit = function (vm) {
  return m('form', {class: 'edit', onsubmit: vm.save.bind(vm)}, [
    m('input[type="submit"]', {value: 'S'}),
    m('span',
      m('input[type="text"]', {
        onchange: m.withAttr('value', vm.editVal),
        value: vm.editVal(),
        config: function (element) {
          if (vm.isEditing()) {
            element.focus();
          }
        }
      })
    )
  ]);
};

// view model
Items.ViewModel = function (model) {

  // model data
  this.model = m.prop(model);

  // view model data
  this.isEditing = m.prop(false);
  this.val = m.prop('');
  this.editVal = m.prop(model.text());
  this.showChildren = m.prop(model.isRoot());
  this.dragOver = m.prop(false);
};
Items.ViewModel.prototype.del = function (event) {
  event.preventDefault();
  this.model().del();
};
Items.ViewModel.prototype.edit = function (event) {
  event.preventDefault();
  this.isEditing(!this.isEditing());
};
Items.ViewModel.prototype.save = function (event) {
  event.preventDefault();
  if (this.editVal() !== this.model().text()) {
    this.model().text(this.editVal());
    this.model().save();
  }
  this.isEditing(false);
};
Items.ViewModel.prototype.add = function (event) {
  event.preventDefault();
  if (this.val() !== '') {
    this.model().createChild(this.val());
    this.val('');
  }
};
Items.ViewModel.prototype.toggle = function (event) {
  this.showChildren(!this.showChildren());
};
Items.ViewModel.prototype.ondragstart = function (event) {
  window.itemDragging = this;
};
Items.ViewModel.prototype.ondragenter = function (event) {
  if (window.itemDragging != this) {
    this.dragOver(true);
    m.redraw();
  }
};
Items.ViewModel.prototype.ondragleave = function (event) {
  this.dragOver(false);
  m.redraw();
};
Items.ViewModel.prototype.ondragend = function (event) { /* noop */ };
Items.ViewModel.prototype.ondrop = function (event) {
  // @TODO: Find way to compare ViewModels strictly (===)
  if (window.itemDragging != this) {
    window.itemDragging.model().order(this.model().getNextOrder());
    window.itemDragging.model().save();
  }
  this.dragOver(false);
  m.redraw();
};

// mount
m.mount(document.body, {controller: Items.Controller, view: Items.View.Root});
