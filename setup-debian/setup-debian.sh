#!/bin/bash

# Ask for hostname
read -p "Which hostname to use for this instance? It should be reprensentative of its domain name, withtou dot. " hostname

# Set the hostname
echo $hostname > /etc/hostname
hostnamectl set-hostname $hostname
echo "127.0.0.1 $hostname" >> /etc/hosts

# Confirm to install dependencies
echo "Installing dependencies"

# Update and install dependencies
apt update && apt upgrade -y
apt install git zsh -y
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# Replace content of the theme file
cd ~/.oh-my-zsh/themes/
mv robbyrussell.zsh-theme robbyrussell.zsh-theme.old
cat <<EOF > ./robbyrussell.zsh-theme
# https://stackoverflow.com/questions/24682876/change-oh-my-zsh-theme-when-ssh-is-run/50356080
local hostname="%{\$fg_bold[black]%}%m"
local ret_status="%(?:%{\$fg_bold[green]%}➜ :%{\$fg_bold[red]%}➜ %s)"
PROMPT='${hostname} ${ret_status}%{\$fg_bold[green]%}%p %{\$fg[cyan]%}%c %{\$fg_bold[blue]%}$(git_prompt_info)%{\$fg_bold[blue]%} % %{\$reset_color%}'
ZSH_THEME_GIT_PROMPT_PREFIX="git:(%{\$fg[red]%}"
ZSH_THEME_GIT_PROMPT_SUFFIX="%{\$reset_color%}"
ZSH_THEME_GIT_PROMPT_DIRTY="%{\$fg[blue]%}) %{\$fg[yellow]%}✗%{\$reset_color%}"
ZSH_THEME_GIT_PROMPT_CLEAN="%{\$fg[blue]%})"
EOF
cd -

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh -y
rm get-docker.sh
