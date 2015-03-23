angular.module('SimpleRESTWebsite', ['angular-storage', 'ui.router', 'backand', 'ngCookies'])
    .config(function($stateProvider, $urlRouterProvider, $httpProvider) {
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'app/templates/login.tmpl.html',
                controller: 'LoginCtrl',
                controllerAs: 'login'
            })
            .state('dashboard', {
                url: '/dashboard',
                templateUrl: 'app/templates/dashboard.tmpl.html',
                controller: 'DashboardCtrl',
                controllerAs: 'dashboard'
            })
        .state('service', {
            url: '/service',
            templateUrl: 'app/templates/service.tmpl.html',
            controller: 'ServiceCtrl',
            controllerAs: 'service'
        })        
        ;
        debugger;
        $urlRouterProvider.otherwise('/dashboard');
        $urlRouterProvider.otherwise('/service');

        $httpProvider.interceptors.push('APIInterceptor');
    })
    .service('APIInterceptor', function($rootScope, $cookieStore) {
        var service = this;

        service.request = function(config) {
            config.headers['Authorization'] = $cookieStore.get('backand_token');
            return config;
        };

        service.responseError = function(response) {
            if (response.status === 401) {
                $rootScope.$broadcast('unauthorized');
            }
            return response;
        };
    })
    .service('UserService', function(store) {
        var service = this,
            currentUser = null;

        service.setCurrentUser = function(user) {
            currentUser = user;
            store.set('user', user);
            return currentUser;
        };

        service.getCurrentUser = function() {
            if (!currentUser) {
                currentUser = store.get('user');
            }
            return currentUser;
        };
    })
    .service('LoginService', function($http) {
        var service = this,
            path = 'Users/';

        function getUrl() {
            return ENDPOINT_URI + path;
        }

        function getLogUrl(action) {
            return getUrl() + action;
        }

        service.login = function(credentials) {
            return $http.post(getLogUrl('login'), credentials);
        };

        service.logout = function() {
            return $http.post(getLogUrl('logout'));
        };

        service.register = function(user) {
            return $http.post(getUrl(), user);
        };

    })
    .service('ItemsModel', function ($http, Backand) {
        debugger;
        var service = this,
            tableUrl = '/1/table/data/',
            //path = 'items/';
            path = 'Service/';

        function getUrl() {
            return Backand.configuration.apiUrl + tableUrl + path;
        }

        function getUrlForId(itemId) {
            return getUrl(path) + itemId;
        }


        service.all = function () {
            return $http.get(getUrl());
        };

        service.fetch = function (itemId) {
            return $http.get(getUrlForId(itemId));
        };


        service.create = function (item) {
            return $http.post(getUrl(), item);
        };

        service.update = function (itemId, item) {
            return $http.put(getUrlForId(itemId), item);
        };

        service.destroy = function (itemId) {
            return $http.delete(getUrlForId(itemId));
        };

        
    })



    .controller('LoginCtrl', function ($rootScope, $state, Backand, $cookieStore, UserService) {
        debugger;
        var login = this;

        function signin() {
            Backand.signin(login.email, login.password, login.appName)
                .then(function(token) {
                    $cookieStore.put(Backand.configuration.tokenName, token);
                    $rootScope.$broadcast('authorized');
                    //$state.go('dashboard');
                   $state.go('service');
                }, function(error) {
                    console.log(error);
                });
        }

        login.newUser = false;
        login.signin = signin;
    })
    .controller('MainCtrl', function ($rootScope, $state, LoginService, Backand) {
        var main = this;

        function logout() {
            Backand.signout();
            $state.go('login');
        }

        $rootScope.$on('unauthorized', function() {
            $state.go('login');
        });

        main.logout = logout;
    })
    .controller('DashboardCtrl', function(ItemsModel){
        var dashboard = this;

        function getItems() {
            ItemsModel.all()
                .then(function (result) {
                    dashboard.items = result.data.data;
                });
        }


        
        function createItem(item) {
            ItemsModel.create(item)
                .then(function (result) {
                    initCreateForm();
                    getItems();
                });
        }

        function updateItem(item) {
            ItemsModel.update(item.Id, item)
                .then(function (result) {
                    cancelEditing();
                    getItems();
                });
        }

        function deleteItem(itemId) {
            ItemsModel.destroy(itemId)
                .then(function (result) {
                    cancelEditing();
                    getItems();
                });
        }

        function initCreateForm() {
            dashboard.newItem = { name: '', description: '' };
        }

        function setEditedItem(item) {
            dashboard.editedItem = angular.copy(item);
            dashboard.isEditing = true;
        }

        function isCurrentItem(itemId) {
            return dashboard.editedItem !== null && dashboard.editedItem.Id === itemId;
        }

        function cancelEditing() {
            dashboard.editedItem = null;
            dashboard.isEditing = false;
        }

        dashboard.items = [];
        dashboard.editedItem = null;
        dashboard.isEditing = false;
        dashboard.getItems = getItems;
        dashboard.createItem = createItem;
        dashboard.updateItem = updateItem;
        dashboard.deleteItem = deleteItem;
        dashboard.setEditedItem = setEditedItem;
        dashboard.isCurrentItem = isCurrentItem;
        dashboard.cancelEditing = cancelEditing;

        initCreateForm();
        getItems();
    })


.controller('ServiceCtrl', function ($http,ItemsModel) {
    var service = this;

    function getItems() {
        ItemsModel.all()
            .then(function (result) {
                debugger;
                service.Service = result.data.data;
            });
    }



    function createItem(item) {
        ItemsModel.create(item)
            .then(function (result) {
                initCreateForm();
                getItems();
            });
    }

    function updateItem(item) {
        ItemsModel.update(item.Id, item)
            .then(function (result) {
                cancelEditing();
                getItems();
            });
    }

    function deleteItem(serviceId) {
        ItemsModel.destroy(serviceId)
            .then(function (result) {
                cancelEditing();
                getItems();
            });
    }

    function initCreateForm() {
        service.newItem = { ServiceType:'', Name: '', Description: '' };
    }

    function setEditedItem(item) {
        service.editedItem = angular.copy(item);
        service.isEditing = true;
    }

    function isCurrentItem(serviceId) {
        return service.editedItem !== null && service.editedItem.Id === serviceId;
    }

    function cancelEditing() {
        service.editedItem = null;
        service.isEditing = false;
    }

    function email(serviceId) {
        debugger;
        $http.get("https://api.backand.com:8079/1/table/action/Service/" + serviceId + "?name=Email");

    }

    service.Service = [];
    service.editedItem = null;
    service.isEditing = false;
    service.getItems = getItems;
    service.createItem = createItem;
    service.updateItem = updateItem;
    service.deleteItem = deleteItem;
    service.setEditedItem = setEditedItem;
    service.isCurrentItem = isCurrentItem;
    service.cancelEditing = cancelEditing;
    service.email = email;
    initCreateForm();
    getItems();
})
;
