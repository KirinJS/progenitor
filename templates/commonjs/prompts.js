exports.prompts = { 
    project_name: {
        message: "Project name",
        validator: /[a-zA-Z][\w*]/
    },
    project_description: {
        message: "Project description",
        default: "Awesome, it is."
    },
    github_prefix: "__git_repo__",
    git_repo: {
        message: "Project git repository",
        default: "github.com/__github_user__/__project_name__"
    },
    project_homepage: {
        message: "Project homepage",
        default: "https://__github_prefix__"
    },
    project_issues: {
        message: "Project public issue tracker", 
        default: "__project_homepage__/issues"
    },
    project_author: {
        message: "Project author"
    },
    project_author_email: {
        message: "Project author's email"
    },
    project_author_url: {
        message: "Project author's homepage",
        default: "__project_homepage__"
    },
    github_user: {
        message: "GitHub username",
        default: "__USER__"
    },
    module_entry_point: {
        message: "Module entry point",
        default: "lib/__project_name__.js"
    } 
};
