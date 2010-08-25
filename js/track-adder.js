/* -*- mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil -*- */

// 
// Dalliance Genome Explorer
// (c) Thomas Down 2006-2010
//
// track-adder.js
//

Browser.prototype.currentlyActive = function(source) {
    for (var i = 0; i < this.tiers.length; ++i) {
        var ts = this.tiers[i].dasSource;
        if (ts.uri == source.uri) {
            // Special cases where we might meaningfully want two tiers of the same URI.
            if (ts.tier_type) {
                if (!source.tier_type || source.tier_type != ts.tier_type) {
                    continue;
                }
            }
            if (ts.stylesheet) {
                if (!source.stylesheet || source.stylesheet != ts.stylesheet) {
                    continue;
                }
            }

            return true;
        }
    }
    return false;
}

function makeButton(name) {
    var regButton = makeElement('span', name);
    regButton.style.backgroundColor = 'rgb(230,230,250)';
    regButton.style.borderStyle = 'solid';
    regButton.style.borderColor = 'red';
    regButton.style.borderWidth = '3px';
    regButton.style.padding = '2px';
    regButton.style.marginLeft = '10px';
    regButton.style.marginRight = '10px';
    regButton.style.width = '100px';
    regButton.style['float'] = 'left';
    return regButton;
}

function activateButton(addModeButtons, which) {
    for (var i = 0; i < addModeButtons.length; ++i) {
        var b = addModeButtons[i];
        b.style.borderColor = (b == which) ? 'red' : 'blue';
    }
}

Browser.prototype.showTrackAdder = function(ev) {
    var thisB = this;
    var mx =  ev.clientX, my = ev.clientY;
    mx +=  document.documentElement.scrollLeft || document.body.scrollLeft;
    my +=  document.documentElement.scrollTop || document.body.scrollTop;

    var popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.top = '' + (my + 30) + 'px';
    popup.style.left = '' + (mx - 30) + 'px';
    popup.style.width = '600px';
    popup.style.height = '500px';
    popup.style.backgroundColor = 'white';
    popup.style.borderWidth = '1px';
    popup.style.borderColor = 'black'
    popup.style.borderStyle = 'solid';

    popup.appendChild(makeElement('div', null, {}, {clear: 'both', height: '10px'})); // HACK only way I've found of adding appropriate spacing in Gecko.

    var addModeButtons = [];
    var makeStab;
    var regButton = makeButton('Registry');
    addModeButtons.push(regButton);
    for (var m in this.mappableSources) {
        var mf  = function(mm) {
            var mapButton = makeButton(thisB.chains[mm].srcTag);
            addModeButtons.push(mapButton);
            mapButton.addEventListener('mousedown', function(ev) {
                ev.preventDefault(); ev.stopPropagation();
                activateButton(addModeButtons, mapButton);
                makeStab(thisB.mappableSources[mm], mm);
            }, false);
        }; mf(m);
    }
    var defButton = makeButton('Defaults');
    addModeButtons.push(defButton);
    var custButton = makeButton('Custom');
    addModeButtons.push(custButton);
    activateButton(addModeButtons, regButton);
    popup.appendChild(makeElement('div', addModeButtons), null);
    
    popup.appendChild(makeElement('div', null, {}, {clear: 'both', height: '10px'})); // HACK only way I've found of adding appropriate spacing in Gecko.
    
    var addButtons = [];
    var custURL, custName;
    var customMode = false;

    var asform = makeElement('form', null, {}, {clear: 'both'});
    var stabHolder = document.createElement('div');
    stabHolder.style.position = 'relative';
    stabHolder.style.overflow = 'auto';
    stabHolder.style.height = '400px';
    asform.appendChild(stabHolder);


    makeStab = function(sources, mapping) {
        customMode = false;
        addButtons = [];
        removeChildren(stabHolder);
        var stab = document.createElement('table');
        stab.style.width='100%';
        var idx = 0;
        for (var i = 0; i < sources.length; ++i) {
            var source = sources[i];
            var r = document.createElement('tr');
            r.style.backgroundColor = thisB.tierBackgroundColors[idx % thisB.tierBackgroundColors.length];

            var bd = document.createElement('td');
            bd.style.textAlign = 'center';
            if (thisB.currentlyActive(source)) {
                bd.appendChild(document.createTextNode('X'));
                thisB.makeTooltip(bd, "This data source is already active.");
            } else if (source.props && source.props.cors) {
                var b = document.createElement('input');
                b.type = 'checkbox';
                b.dalliance_source = source;
                if (mapping) {
                    b.dalliance_mapping = mapping;
                }
                bd.appendChild(b);
                addButtons.push(b);
                thisB.makeTooltip(bd, "Check here then click 'Add' to activate.");
            } else {
                bd.appendChild(document.createTextNode('!'));
                thisB.makeTooltip(bd, makeElement('span', ["This data source isn't accessible because it doesn't support ", makeElement('a', "CORS", {href: 'http://www.w3.org/TR/cors/'}), "."]));
            }
            r.appendChild(bd);
            var ld = document.createElement('td');
            ld.appendChild(document.createTextNode(source.name));
            if (source.description && source.desc.length > 0) {
                thisB.makeTooltip(ld, source.desc);
            }
            r.appendChild(ld);
            stab.appendChild(r);
            ++idx;
        }
        stabHolder.appendChild(stab);
    };
    makeStab(thisB.availableSources);

    regButton.addEventListener('mousedown', function(ev) {
        ev.preventDefault(); ev.stopPropagation();
        activateButton(addModeButtons, regButton);
        makeStab(thisB.availableSources);
    }, false);
    defButton.addEventListener('mousedown', function(ev) {
        ev.preventDefault(); ev.stopPropagation();
        activateButton(addModeButtons, defButton);
        makeStab(thisB.defaultSources);
    }, false);
    custButton.addEventListener('mousedown', function(ev) {
        ev.preventDefault(); ev.stopPropagation();
        activateButton(addModeButtons, custButton);
        customMode = true;

        removeChildren(stabHolder);
        stabHolder.appendChild(makeElement('p', 'Add a custom DAS datasource.  NB. the URL must end with a "/" character'));
        stabHolder.appendChild(document.createTextNode('Label: '));
        stabHolder.appendChild(makeElement('br'));
        custName = makeElement('input', '', {value: 'New track'});
        stabHolder.appendChild(custName);
        stabHolder.appendChild(makeElement('br'));
        stabHolder.appendChild(document.createTextNode('URL: '));
        stabHolder.appendChild(makeElement('br'));
        custURL = makeElement('input', '', {size: 80, value: 'http://www.derkholm.net:8080/das/medipseq_reads/'});
        stabHolder.appendChild(custURL);
    }, false);


    var addButton = document.createElement('span');
    addButton.style.backgroundColor = 'rgb(230,230,250)';
    addButton.style.borderStyle = 'solid';
    addButton.style.borderColor = 'blue';
    addButton.style.borderWidth = '3px';
    addButton.style.padding = '2px';
    addButton.style.margin = '10px';
    addButton.style.width = '150px';
    // addButton.style.float = 'left';
    addButton.appendChild(document.createTextNode('Add'));
    addButton.addEventListener('mousedown', function(ev) {
        ev.stopPropagation(); ev.preventDefault();

        if (customMode) {
            var nds = new DASSource({name: custName.value, uri: custURL.value});
            thisB.sources.push(nds);
            thisB.makeTier(nds);
	    thisB.storeStatus();
        } else {
            for (var bi = 0; bi < addButtons.length; ++bi) {
                var b = addButtons[bi];
                if (b.checked) {
                    var nds = b.dalliance_source;
	            thisB.sources.push(nds);
                    thisB.makeTier(nds);
		    thisB.storeStatus();
                }
            }
        }

        thisB.removeAllPopups();
    }, false);

    var canButton = document.createElement('span');
    canButton.style.backgroundColor = 'rgb(230,230,250)';
    canButton.style.borderStyle = 'solid';
    canButton.style.borderColor = 'blue';
    canButton.style.borderWidth = '3px';
    canButton.style.padding = '2px';
    canButton.style.margin = '10px';
    canButton.style.width = '150px';
    // canButton.style.float = 'left';
    canButton.appendChild(document.createTextNode('Cancel'))
    canButton.addEventListener('mousedown', function(ev) {
        ev.stopPropagation(); ev.preventDefault();
        thisB.removeAllPopups();
    }, false);

    var buttonHolder = makeElement('div', [addButton, canButton]);
    buttonHolder.style.margin = '10px';
    asform.appendChild(buttonHolder);

    popup.appendChild(asform);
    this.hPopupHolder.appendChild(popup);  
}