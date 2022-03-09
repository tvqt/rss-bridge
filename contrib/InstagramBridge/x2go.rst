====================================================================
 X2GO Server + Firefox installation instructions on Debian Bullseye
====================================================================

- Login as root.

- Execute following commands

.. code-block:: sh

   apt-key adv --recv-keys --keyserver keyserver.ubuntu.com E1F958385BFE2B6E

   echo "deb http://packages.x2go.org/debian bullseye extras main" > /etc/apt/sources.list.d/x2go.list

   apt-get update

   apt-get install x2goserver icewm-lite firefox-esr

   # create non-root user
   adduser --shell /bin/bash noroot

- Configurate new user

.. code-block:: sh

   su - noroot

   mkdir -p ~/.ssh

   # copy contents of ~/.id_rsa.pub from your machine and pasted them here:
   nano ~/.ssh/authorized_keys

   # exit from noroot
   exit

   # exit from root
   exit

===================
 X2GO Client setup
===================

- Install x2go client: https://wiki.x2go.org/doku.php/doc:installation:x2goclient

- Create new session:

  - Name: any name

  - Host: hostname of your server (it starts with cammd)

  - User: noroot

  - RSA Key: full path to your private ssh key

  - Session type: ICEWM

  - In Input/output tab: change screen size as you need

  - In Media tab: deactivate sound (optional, recomended)

  - Save

- Session is created on the right. To connect click on "bunny" image

- That is it. You can now run firefox. Don't forget to configurate it for using with RSS-Bridge (see README.rst)
