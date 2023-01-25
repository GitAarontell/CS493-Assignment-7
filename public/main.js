let web =
    {
        "redirect_uris":[
            "https://hw6-bertella.wn.r.appspot.com/authPage",
            "https://8080-cs-1005895697844-default.cs-us-west1-ijlt.cloudshell.dev/auth0"
            ]
    }

let subForm = document.getElementById('submitForm')
subForm.setAttribute('action', web.redirect_uris[1]);

