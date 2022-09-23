# Akamai EdgeWorkers Toolkit for VSCode

## Install
    
1.  Install the latest [VS Code](https://code.visualstudio.com/)

2. From the VS Code Extensions Marketplace, search for "EdgeWorkers" and hit the Install button.


## Dependencies / Usage

1.  The EdgeWorkers panel will be automatically added to the left side of the VSCode window.
    
2.  The EdgeWorkers VSCode extension depends on the Akamai CLI, minimum version 1.3.0 with EdgeWorkers command minimum version 1.4.1. Many of our customers will already have this set up, but if not on first launch of the EdgeWorkers panel they will be prompted to install and set up OPEN API credentials in .edgerc [as outlined in the developer docs](https://developer.akamai.com/cli/docs/getting-started). Usage from here assumes you have completed this step.
    
3.  Additional configuration is available in the VSCode preferences; most customers will not need to use this but if they use multiple .edgerc sections or a custom edgerc path they will, and Akamai internal users will likely need to fill in Account Key here:
    

<img src="https://lh3.googleusercontent.com/Eu5ijgzMEEDwOEbL_yw7CN_s70W-YS6f5zANsvGL6-imNGuywpBDeTw8rggWI9KbsqCZCgSf0L5xTzZP0w6f6N3FTKwUABtfYgIpK_3wfean9EtC-hT8saf6kSjp0FdpdQ7mcOga=s0" width="300px">

## Functionality Walkthrough

1.  List EdgeWorker details in the left side panel:
    

<img src="https://lh5.googleusercontent.com/Mx2IlRIWFruKq4HsuA9swyJInvn2qNvdOsoKqNn54b_ke99ERS16RMnR35IOz7yOO1CkZKeoVjWCu2W2H8nBhGXfGji-eTyhmCyHGnm0xwHyL1Cqjh6p5vUu7hUrznDmV3kcIOTQ=s0" width="300px">

2.  See EdgeWorker versions and version file contents by clicking through the tree:
    

<img src="https://lh4.googleusercontent.com/TKlmavraE8p51PKkLecbpRkui4tfQEJROdJ2oct3gpj7NjkD3GVvKcWboHeWxBc2QACBrA6wab8NSRvZemnYuWyB9e4rQ410GsCiuvBt-DeWvhU-2cw7FPBFWn5MgOUyE_CjX96f=s0" width="300px">

3.  Download an EdgeWorker by clicking the download button to the right of the version number. The download is automatically extracted for easy viewing of contents:
    

<img src="https://lh4.googleusercontent.com/UILVZTXWdSLD4R4Y7kedWp6ei8LpfUvwaNAArTyksv_TYFJz6SQSUIZkZmbLaS999r-Sjqi0pi2NWBdmeXFwQ1xQFQXS6tCSFb8VDBF0ckBRdyLyyuwHmgnKWtUnPaPhOlPeLMlo=s0" width="300px">
<img src="https://lh6.googleusercontent.com/MFC_J4l1JC955Ja_PfOQvvQY-sOoKGKEDYMRT687_680imbMWFyV4PJTVsw7QTxOZPMfXpnYeKezdcniFvURL50xheCPSsDhaw3vYlEnDJeIr2l_9Cya8vLWzTwLJ3BIqVESsguv=s0" width="300px">

4.  Activating an EdgeWorker can be done by clicking the leftmost / “Activate EdgeWorker” icon in the EdgeWorkers pane toolbar; this will bring up the Activation UI:
    

<img src="https://lh4.googleusercontent.com/U2wGRtKVWLBb_ZRFUNEbzfqxdFwyjd59K3P52yJSumLX9aTothrLxhhxClPCpx09aFq3QTG1wiFB13qVixZKmk6qauU749meIERp4tS7HFVt78c3sWY4Ks0rJeiJCWKVRWdsyJSw=s0" width="300px">

<img src="https://lh3.googleusercontent.com/pz59UgocDghNTNDJDlg4nj5yU4hxDzICSRAgAPMgBho3RKCcLBiVGzYlz2OtRknRbn0eOo3REpciT-R4lbEvCvsJgLpIjhXsegD49x3EvkOryeIAtKX9bnDiBDjgBriIdmY3JqBg=s0" width="300px">

5.  Registering a new EdgeWorker can by done by clicking on the R / “Register EdgeWorker” icon in the EdgeWorkers pane toolbar
    
6.  A new version for an existing EdgeWorker can by added via the + button next to an EdgeWorker:
    

<img src="https://lh6.googleusercontent.com/T6jDue70L2wMYmO3mbGA-xJhyGyV0z2vhH-im3E7nh8-Zvtm9WQ8DzEvaZVoLZpWDdDyDGh3xd5ql8UXroOY4cgD5Bsf8H-YbBcNLI3ymfzGVRrsgSGwW665EzLhHSM9gPnlsukx=s0" width="300px">

7.  Or by right-clicking on an EdgeWorker tarball/bundle in the VS Code file explorer:
    

<img src="https://lh6.googleusercontent.com/VrCAWBjDuKlOenbpPbk519VUvSKmHyRqcPhRGdW4lx6SbHuNukq4koxWd6Ej2HDeHQjGnwY3VrxNm0td9OBtWkbKE7Ox-n67LqdLW1xuIciCjk1CTIWEJpGm3J65hLNi0qI9XUU9=s0" width="300px">

8.  As shown above the same tarball can also be uploaded to the EdgeWorkers Sandbox for testing.
    
9.  Finally new EdgeWorker tarballs can be created + validated from source code by right-clicking on an EdgeWorker tarball.json in VS Code file explorer:
    

<img src="https://lh3.googleusercontent.com/zyxQgxFybeyo6sM5ry0Kz_6wkAAmAZZvt7H_iJd4YaMmen3w73HLA_b7uAR-1EgqEkxwCMuSg_Y7V2LT5vs79vePGutJo1JIMGbSlUx-1wPso5cP3DWMXQ0UIUCrPue2i2mkjexi=s0" width="300px">
