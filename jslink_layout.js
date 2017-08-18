/*

  Save this (jslink_layout.js) and form.html somewhere in your site.

  I create a folder structure in SiteAssets like so:

    /SiteAssets/lib              - This is where generic JS/CSS/HTML goes
                                   (e.g. jQuery, SPServices, generic SharePoint libraries).
    /SiteAssets/lib<App>         - This is where JS/CSS/HTML specific to a given project/app goes.
    /SiteAssets/Lists/<ListName> - This is where JS/CSS/HTML specific to a given List goes.

  Doing this means you can use dynamic references elsewhere in your code, instead of hardcoding paths.

  In the JSLink property of your ListFormWebPart, add a link to this file using a ~site or ~sitecollection token,
  i.e. using my folder structure, it would be ~site/SiteAssets/lib/jslink_layout.js.

  YOU CAN'T USE ../../ style relative paths with JSLink paths, they don't seem to work. Use tokens, root relative,
  or tokens. (Tokens are best because they're dynamic, so essentially relative.)

  Add Content Editor Web Parts to your *Form.aspx pages, with a link to your form template,
  i.e. using my folder structure, it would be ../../SiteAssets/Lists/<ListName>/form.html.

  CONTENT EDITOR WEB PARTS DON'T LIKE TOKENS, SO USE A RELATIVE OR ABSOLUTE PATH. (Yay, SharePoint.)

  Haven't yet tested with ctx.Templates.

  Note: Debugging jslink js a bitch. Good luck.

*/

//yeah, you could just append a STYLE tag yourself, but this function is cool. Definition at EOF.
addStylesheetRules([
  ['.ms-formtable', ['display', 'none', true]]
])

SP.SOD.executeFunc('clienttemplates.js', 'SPClientTemplates', function () {

  function init () {

    var templates = {}
    var override = {}
    var postFields = {}

    override.OnPostRenderAll = function (ctx) {
      var listId = ctx.FormContext.listAttributes.Id
      var templ = templates[listId]
      templ.classList.remove('hidden')
    }

    override.OnPostRender = function (ctx) {
      var fields

      if (ctx.Templates) {
        fields = ctx.Templates.Fields
      } else {
        fields = ctx.FieldControlModes
      }

      postFields[ctx.FormUniqueId] = postFields[ctx.FormUniqueId] || 0
      postFields[ctx.FormUniqueId]++

      if (postFields[ctx.FormUniqueId] === Object.keys(fields).length) {
        override.OnPostRenderAll(ctx)
      }
    }

    override.OnPreRender = function (ctx) {
      if (!ctx.FormContext) {
        return
      }

      var listId = ctx.FormContext.listAttributes.Id

      var templ = templates[listId] || document.querySelector('[data-list-id="' + listId + '"]') || document.querySelector('[data-role="form"]')
      if (!templ) {
        return
      }

      // move our template above the original .ms-formtable
      if (!templates[listId]) {
        var formTable = document.querySelector('#WebPart' + ctx.FormUniqueId + ' .ms-formtable')
        formTable.parentNode.insertBefore(templ, formTable)
        templates[listId] = templ
      }

      var field = ctx.ListSchema.Field[0]

      // don't mess with the meta-fields
      if (['Created', 'Author', 'Modified', 'Editor'].indexOf(field.Name) !== -1) { return }

      // find our placeholder control element, exii if we can't
      var el = document.querySelector('#' + ctx.FormUniqueId + listId + field.Name)
      if (!el) { return }
      var commentNodes = [].filter.call(el.parentNode.childNodes, function(item, index){return item.nodeType === Node.COMMENT_NODE})
      var fieldComment;
      if (commentNodes.length){
        fieldComment = commentNodes[0]
      }

      var target = templ.querySelector('[data-field~="' + field.Name + '"]')
      var generic = templ.querySelector('[data-field="*"]')

      // if it's a shorthand template, kill the target placeholder so the generic '*' template gets used
      if (target && !target.querySelector('[data-role="field-control"]')) {
        target = null
      }

      // exit if we can't find a target or the generic '*' template elem
      // or the generic '*' template elem doesn't have a field-control elem
      if (!target && !generic && !generic.querySelector('[data-role="field-control"]')) { return }

      // if there's no direct target, clone the generic '*' template and use that
      if (!target) {
        target = generic.cloneNode(true)
        target.setAttribute('data-field', field.Name)
        generic.parentNode.insertBefore(target, generic)
      }

      if (field.Name !== 'Attachments') {
        field.Value = STSHtmlDecode(ctx.ListData.Items[0][field.Name])
      } else {
        document.querySelector('#idAttachmentsRow').id = 'idAttachmentsRowOld'
        target.id = 'idAttachmentsRow'
      }

      //evaluate tokens
      var html = target.innerHTML
      html = html.replace(/{[^} ]+}/g, function (m) {
        m = m.slice(1, -1)
        return field[m]
      })
      target.innerHTML = html

      //copy the properties from the field object to data attributes, they might come in handy.
      Object.keys(field).forEach(function (item, index) {
        target.setAttribute('data-field-' + item, field[item])
      })

      //copy the data properties from the placeholder elem, they might come in handy.
      el.outerHTML.match(/\sdata-[\S]+/g).forEach(function(item,index){
        var attrName = item.match(/\S+?=/)[0].slice(0,-1);
        target.setAttribute(attrName, el.getAttribute(attrName));
      })

      var vIfFalseElems = target.querySelectorAll('[v-if=false]');
      [].forEach.call(vIfFalseElems, function (item, index) {
        item.remove()
      })

      var vShowFalseElems = target.querySelectorAll('[v-show=false]');
      [].forEach.call(vShowFalseElems, function (item, index) {
        item.classList.add('hidden')
      })

      var control = target.querySelector('[data-role="field-control"]')
      control && control.parentNode.replaceChild(el, control)
      fieldComment && el.parentNode.insertBefore(fieldComment, el)
    }

    SPClientTemplates.TemplateManager.RegisterTemplateOverrides(override)
  }

  //I think this RegisterModuleInit is necessary for MDS, but I haven't tested it.
  RegisterModuleInit(SPClientTemplates.Utility.ReplaceUrlTokens('~siteCollection/DataExchanges/DevDEX/SiteAssets/Lists/Test List/jslink.js'), init)

  init()
});

// modified item.hasOwnProperty check line, as SharePoint overwrites DocumentType object causing errors.
// node .remove() Polyfill
// from:https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md
(function (arr) {
  arr.forEach(function (item) {
    if (!item || (item.hasOwnProperty && item.hasOwnProperty('remove'))) {
      return
    }
    Object.defineProperty(item, 'remove', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function remove () {
        this.parentNode.removeChild(this)
      }
    })
  })
})([Element.prototype, CharacterData.prototype, DocumentType.prototype])

/**
 * Add a stylesheet rule to the document (may be better practice, however,
 * to dynamically change classes, so style information can be kept in
 * genuine stylesheets (and avoid adding extra elements to the DOM))
 * Note that an array is needed for declarations and rules since ECMAScript does
 * not afford a predictable object iteration order and since CSS is
 * order-dependent (i.e., it is cascading); those without need of
 * cascading rules could build a more accessor-friendly object-based API.
 * @param {Array} rules Accepts an array of JSON-encoded declarations
 * @example
addStylesheetRules([
  ['h2', // Also accepts a second argument as an array of arrays instead
    ['color', 'red'],
    ['background-color', 'green', true] // 'true' for !important rules
  ],
  ['.myClass',
    ['background-color', 'yellow']
  ]
]);
 */
//from: shttps://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule
function addStylesheetRules (rules) {
  var styleEl = document.createElement('style')
  var styleSheet

  // Append style element to head
  document.head.appendChild(styleEl)

  // Grab style sheet
  styleSheet = styleEl.sheet

  for (var i = 0, rl = rules.length; i < rl; i++) {
    var j = 1
    var rule = rules[i]
    var selector = rules[i][0]
    var propStr = ''
    // If the second argument of a rule is an array of arrays, correct our variables.
    if (Object.prototype.toString.call(rule[1][0]) === '[object Array]') {
      rule = rule[1]
      j = 0
    }

    for (var pl = rule.length; j < pl; j++) {
      var prop = rule[j]
      propStr += prop[0] + ':' + prop[1] + (prop[2] ? ' !important' : '') + ';\n'
    }

    // Insert CSS Rule
    styleSheet.insertRule(selector + '{' + propStr + '}', styleSheet.cssRules.length)
  }
}