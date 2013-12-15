var app = angular.module("github", []);

app.factory('github', ['$http', function(http) {
    var api_root = 'https://api.github.com';

    return {
        getUser: function(username) {
            return http.get(api_root + '/users/' + username);
        },
        getRepos: function(username) {
            return http.get(api_root + '/users/' + username + '/repos');
        },
        getRepo: function(repo) {
            return http.get(api_root + '/repos/' + repo);
        }
    };
}]);

app.directive('ghImg', function() {
    return {
        restrict: 'E',
        scope: {
            'src': '='
        },
        template: '<img src="{{ src }}">'
    };
});

app.filter('ago', function() {
    return function(value) {
        return moment(value).fromNow(true);
    };
});

app.controller("GithubController", ['$scope', 'github', function(scope, github) {
    var config = document.body.dataset;
    console.log(config);

    var week_half_life  = 1.146 * Math.pow(10, -9);
    var push_weight = 1;
    var watcher_weight = 1.314 * Math.pow(10, 7);
    var now = new Date;

    var hotness = function(repo) {
        var push_delta = now - Date.parse(repo.pushed_at);
        var create_delta = now - Date.parse(repo.created_at);

        var hotness = push_weight * Math.pow(Math.E, -1 * week_half_life * push_delta) + watcher_weight * repo.stargazers_count / create_delta;
        return hotness
    };

    var push_date = function(repo) {
        return repo.pushed_at;
    };

    github.getUser(config.username).success(function(data) {
        scope.user = data;
    });

    var repos = [];

    var got_repos = function(data) {
        repos = repos.concat(data);

        scope.recent = _.chain(repos)
            .sortBy(push_date)
            .slice(-3)
            .reverse()
            .value()

        scope.repos = _.chain(repos)
            .sortBy(hotness)
            .reverse()
            .value()

        scope.source_repos = _.filter(repos, function(repo) {
            return !repo.fork;
        }).length;
    };
    var got_repo = function(data) {
        got_repos([data]);
    };

    github.getRepos(config.username).success(got_repos);
    if (config.additional) {
        var extra = config.additional.split(',');
        _.each(extra, function(repo) {
            console.log(extra);
            github.getRepo(repo).success(got_repo);
        });
    }
}]);
