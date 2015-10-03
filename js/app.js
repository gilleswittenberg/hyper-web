

//var url = 'http://54.93.181.197:7676/';
var url = 'http://localhost:7676/';

// components
var Items = {};

// model
Items.Model = function (data) {

  data = data || {};
  this.id = m.prop(data.id);
  this.parentId = m.prop(data.parentId);
  this.parent = m.prop(data.parent);
  this.children = m.prop([]);
  this.isRoot = m.prop(data.isRoot);
  if (data.children) {
    data.children.forEach(function (data) {
      var model, vm;
      data.parent = this;
      data.parentId = this.id();
      model = new Items.Model(data);
      vm = new Items.ViewModel(model);
      this.children().push(vm);
    }.bind(this));
  }
  this.name = m.prop(data.name);
  this.text = m.prop(data.text);
};
Items.Model.prototype.del = function () {

  // @TODO: Allow deletion before server responded a save call
  if (!this.id()) return;

  this.parent().removeChild(this.id());

  return m.request({
    method: 'DELETE',
    url: url + 'nodes/' + this.id()
  });
};
Items.Model.prototype.save = function () {

  var method, data = {};

  if (!this.id()) {
    method = 'POST';
    data.parentId = this.parentId();
  } else {
    method = 'PUT';
  }
  data.text = this.text;

  return m.request({
    method: method,
    url: url + 'nodes/',
    data: data
  }).then(function (response) {
    this.id(response.id);
  }.bind(this));
};
Items.Model.prototype.createChild = function (text) {
  var child = new Items.Model({
    parent: this,
    parentId: this.id(),
    text: text
  });
  var vm = new Items.ViewModel(child);
  this.children().push(vm);
  return child.save();
};
Items.Model.prototype.removeChild = function (id) {
  this.children().forEach(function (vm, index) {
    if (vm.model().id() === id) {
      this.children().splice(index, 1);
    }
  }.bind(this));
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
    m('li', Items.View.Form(vm))
  ]);
};
Items.View.Item = function (vm) {
  return m('li', [
    m('span', {onclick: vm.toggle.bind(vm)}, vm.model().text()),
    m('button.delete', {onclick: vm.del.bind(vm)}, 'X'),
    Items.View.Children(vm)
  ]);
};
Items.View.Form = function (vm) {
  return m('form', {onsubmit: vm.add.bind(vm)}, [
    m('input[type=text]', {onchange: m.withAttr('value', vm.val), value: vm.val()}),
    m('input[type=submit]', {value: '+'})
  ]);
};

// view model
Items.ViewModel = function (model) {

  // model data
  this.model = m.prop(model);

  // view model data
  this.val = m.prop('');
  this.showChildren = m.prop(model.isRoot());
};
Items.ViewModel.prototype.del = function (event) {
  event.preventDefault();
  this.model().del();
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

// mount
m.mount(document.body, {controller: Items.Controller, view: Items.View.Root});
