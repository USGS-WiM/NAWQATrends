/*@preserve
	Copyright: 2012 WiM - USGS
	Author: Jon Baier USGS Wisconsin Internet Mapping
	Created: Novemeber 06, 2012	
*/
dojo.provide("wim.CollapsingContainer"),dojo.require("dijit._Container"),dojo.require("dijit._TemplatedMixin"),dojo.require("dijit._OnDijitClickMixin"),dojo.require("dijit._WidgetBase"),dojo.require("dojo.fx"),dojo.declare("wim.CollapsingContainer",[dijit._WidgetBase,dijit._OnDijitClickMixin,dijit._Container,dijit._TemplatedMixin],{templatePath:dojo.moduleUrl("wim","templates/CollapsingContainer.html"),baseClass:"collapsingContainer",title:"coolContainer",titleImageUrl:null,getContentNode:function(){return this.containerNode},constructor:function(){},_onIconClick:function(){"none"==dojo.getStyle(this.containerNode,"display")?dojo.fx.wipeIn({node:this.containerNode,duration:300}).play():dojo.fx.wipeOut({node:this.containerNode,duration:300}).play()},postCreate:function(){this.titleNode.innerHTML=this.title,this.title,null!=this.titleImageUrl}});