module.exports = function(screenManager, storage) {
  
  var React        = require('react/addons');
  var Future       = require('data.future');
  var components   = require('./components');
  var Dialogs      = require('./dialogs')(screenManager);
  var utils        = require('../utils');
  var Novel        = require('../novel')(storage);
  var extend       = require('xtend');
  var MediumEditor = require('medium-editor');
  var Window       = WebkitUI.Window.get();
  var $            = jQuery;

  var { showMessage } = utils;
  
  var SAVE_DELAY = 5000;

  function countWords(text) {
    return text.trim().split(/\s+/).length
  }



  var WordCount = React.createClass({
    getDefaultProps: function() {
      return { text: '', selection: '' }
    },

    selectedText: function(words) {
      return (
        <span className="selected-words-panel">
          (<strong>{words}</strong> selected)
        </span>
      )
    },

    render: function() {
      return (
        <div className="statusbar-panel" id="wordcount">
          <strong>{countWords(this.props.text)}</strong> words
          {
            this.props.selection?   this.selectedText(countWords(this.props.selection))
            : /* otherwise */       <span />
          }
        </div>
      )
    }
  });

  var Editor = React.createClass({
    getInitialState: function() {
      return {
        modified: false,
        text: this.props.initialText,
        plainText: '',
        selectedText: '',
        novelTitle: this.props.novelTitle
      }
    },

    componentDidMount: function() {
      var root = this.refs.editorContainer.getDOMNode();
      var article = this.refs.article.getDOMNode();
      var header = this.refs.header.getDOMNode();

      article.innerHTML = this.state.text;
      header.innerText = this.state.novelTitle;
      var text = article.innerText;
      this.setState({
        text: article.innerHTML,
        plainText: text,
        modified: false,
        headerEditor: new MediumEditor([header], {
          buttons: [],
          disableReturn: true,
          placeholder: 'Your novel\'s title',
          disableToolbar: true
        }),
        editor: new MediumEditor([article], {
          buttons: ['bold', 'italic', 'underline', 'header1', 'quote'],
          firstHeader: 'h2',
          placeholder: 'Type your novel here...',
          insertHrOnDoubleReturn: true,
          elementsContainer: root
        })
      });
      
      $(root).on('input', '.editable', function() {
        this.handleStateUpdate({
          content: article,
          header: header,
          contentText: article.innerText,
          headerText: header.innerText
        })
      }.bind(this));

      $(root).on('mouseup mousedown', this.handleSelectionChange);

      if (this.props.onLoaded)  this.props.onLoaded({
        content: article,
        contentText: article.innerText
      })
    },

    onSaved: function() {
      this.setState({ modified: false });
    },

    onClosed: function() {
      this.state.editor.deactivate();
      this.state.headerEditor.deactivate();
      $(root).off('input select mouseup mousedown')
    },

    handleSelectionChange: function() {
      this.setState({ selectedText: window.getSelection().toString() })
    },

    handleStateUpdate: function(data) {
      this.setState({ 
        text: data.content.innerHTML,
        plainText: data.contentText,
        modified: true
      });

      if (this.props.onChange) this.props.onChange(data)
    },

    getArticle: function() {
      return this.refs.article.getDOMNode().innerHTML;
    },

    getHeader: function() {
      return this.refs.header.getDOMNode().innerText;
    },

    isDirty: function() {
      return this.state.modified
    },

    addNewSection: function() {
      var editorContainer = this.refs.editorContainer.getDOMNode();
      var article = this.refs.article.getDOMNode();
      article.appendChild($('<h2><br /></h2>').get(0));
      
      var range = document.createRange();
      range.selectNodeContents(article);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      editorContainer.scrollTop = article.scrollHeight
    },

    render: function() {
      var modified = this.state.modified? 'Modified' : 'Saved'
      
      return (
        <div className="editor-container">
          <div className="statusbar">
            <WordCount text={this.state.plainText} selection={this.state.selectedText} />
            <div className="statusbar-panel" id="docstate">{ modified }</div>
          </div>

          <section className="editor" ref="editorContainer">
            <header id="editor-header" className="editable header" ref="header"></header>
            <div className="article-wrapper">
              <article id="editor-article" className="editable content" ref="article"></article>
            </div>
          </section>
        </div>
      )
    }
  });

  var Sidebar = React.createClass({
    getInitialState: function() {
      return { sections: [] }
    },

    getDefaultProps: function() {
      return {
        onCancel: function(){ },
        onNewSection: function(){ },
        onNovelExport: function(){ },
        onNovelEdit: function(){ },
        onNovelClose: function(){ }
      }
    },

    onTextUpdated: function(data) {
      var headings = [].slice.call(data.content.querySelectorAll('h2'))
                       .map(function(a) {
                         return { element: a, text: a.innerText }
                       });
      this.setState({ sections: headings });
    },

    navigateToSection: function(element) {
      return function() {
        element.scrollIntoView()
      }
    },


    showSettings: function() {
      utils.run($do {
        home <- storage.at('settings.home') <|> Future.of(path.join(utils.home(), '.Raven'));
        author <- storage.at('settings.author') <|> Future.of('');
        screenManager.navigate(screenManager.STACK, '/dialog/settings', {
          initialHome: home,
          initialAuthor: author
        })
      })
    },

    showAbout: function() {
      utils.run(screenManager.navigate(screenManager.STACK, '/dialog/about'));
    },

    render: function() {
      return (
        <div className="sidebar-overlay">
          <div className="overlay-area" onClick={this.props.onCancel}></div>
          <div className="sidebar">
            <ul className="tooling-list">
              <li className="tooling-section">
                <h3 className="tooling-section-title">Chapters</h3>
                <ul className="tooling-links">
                  {
                    this.state.sections.map(function(section, i) {
                      return (
                        <li className="item icon-text" onClick={ this.navigateToSection(section.element) }>
                          <a href="#">{section.text}</a>
                        </li>
                      )
                    }.bind(this))
                  }
                  <li className="item new-item icon-new-item" onClick={ this.props.onNewSection }>
                    <a href="#">New Chapter</a>
                  </li>
                </ul>
              </li>
        
              <li className="tooling-section">
                <h3 className="tooling-section-title">Novel</h3>
                <ul className="tooling-links">
                  <li className="item icon-export" onClick={ this.props.onNovelExport }>
                    <a href="#">Export as...</a>
                  </li>
                  <li className="item icon-settings" onClick={ this.props.onNovelEdit }>
                    <a href="#">Edit metadata</a>
                  </li>
                  <li className="item icon-close" onClick={ this.props.onNovelClose }>
                    <a href="#">Close</a>
                  </li>
                </ul>
              </li>

              <li className="tooling-section">
                <h3 className="tooling-section-title">Raven</h3>
                <ul className="tooling-links">
                  <li className="item icon-settings" onClick={ this.showSettings }>
                    <a href="#">Global settings</a>
                  </li>
                  <li className="item icon-about" onClick={ this.showAbout }>
                    <a href="#">About Raven</a>
                  </li>
                </ul>
              </li>

            </ul>
          </div>
        </div>
      )
    }
  });

  var Heading = React.createClass({
    getInitialState: function() {
      return { inKiosk: Window.isKioskMode }
    },
    
    notifyMenuClick: function() {
      if (this.props.onMenu) this.props.onMenu()
    },

    changeScreenMode: function() {
      Window.toggleKioskMode()
      this.setState({ inKiosk: !this.state.inKiosk });
    },
    
    render: function() {
      var screenModeClass = React.addons.classSet({
        'menu-button': true,
        'icon-fullscreen': !Window.isKioskMode,
        'icon-restore-window': Window.isKioskMode
      });

      return (
        <div className="editor-heading">
          <a href="#" onClick={this.notifyMenuClick} className="menu-button icon-menu"></a>
          <a href="#" onClick={this.changeScreenMode} className={ screenModeClass }></a>
        </div>
      )
    }
  })

  var Screen = React.createClass({
    getInitialState: function() {
      return { isSidebarActive: false, novel: this.props.novel }
    },

    getDefaultProps: function() {
      return { initialText: '<p><br></p>' }
    },

    componentWillMount: function() {
      window.Intent.quit.listen(this.onQuit)
    },

    componentWillUnmount: function() {
      window.Intent.quit.deafen(this.onQuit);
    },

    onQuit: function(event) {
      if (this.refs.editor.isDirty()) {
        
        var novel = this.state.novel;
        var editor = this.refs.editor;
        return $do {
          utils.spawn(Dialogs.message('Raven', 'Hang on a little while we save your novel...'));
          Novel.save(extend(novel, { title: editor.getHeader() }), editor.getArticle());
        }
      } else {
        return Future.of()
      }
    },

    deactivateSidebar: function() {
      this.setState({ isSidebarActive: false })
    },

    activateSidebar: function() {
      this.setState({ isSidebarActive: true })
    },

    close: function() {
      this.refs.editor.onClosed();
      utils.run(screenManager.navigate(screenManager.DONT_STACK, '/'))
    },

    handleChanges: function(data) {
      if (!this.isMounted()) return;

      var self = this;
      var novel = this.state.novel;
      var editor = this.refs.editor;
      var sidebar = this.refs.sidebar;
      utils.run($do {
        newNovel <- Novel.save(extend(novel, { title: data.headerText }), data.content.innerHTML);
        return self.setState({ novel: newNovel });
        return editor.onSaved();
        return sidebar.onTextUpdated(data);
      })
    },

    updateSidebar: function(data) {
      this.refs.sidebar.onTextUpdated(data)
    },

    addNewSection: function() {
      this.refs.editor.addNewSection();
      this.deactivateSidebar();
    },

    exportNovel: function() {
      var self = this;
      var editor = this.refs.editor;
      utils.run(screenManager.navigate(screenManager.STACK, '/dialog/story/export', {
        novel: self.state.novel,
        text: editor.getArticle()
      }))
    },

    editNovelMeta: function() {
      var self = this;
      utils.run($do {
        screenManager.navigate(screenManager.STACK, '/dialog/story/meta', {
          initialAuthor: self.state.novel.author,
          initialTags: self.state.novel.tags || [],
          path: self.state.novel.path,
          title: self.state.novel.title,
          onSave: function(newData) {
            var oldNovel = self.state.novel;
            var currentNovel = extend(oldNovel, {
              author: newData.author,
              tags: newData.tags
            });
            return $do {
              newNovel <- Novel.saveMetadata(currentNovel);
              return self.setState({ novel: newNovel });
            }
          }
        })
      })
    },
    
    render: function() {
      var screenClasses = React.addons.classSet({
        'screen': true,
        'sidebar-active': this.state.isSidebarActive
      })
      
      return (
        <div id="editor-screen" className={screenClasses}>
          <Heading onMenu={this.activateSidebar} />
          <Editor onChange={utils.debounce(this.handleChanges, SAVE_DELAY)}
                  onLoaded={this.updateSidebar}
                  initialText={this.props.initialText}
                  novelTitle={this.state.novel.title}
                  ref="editor" />
          <Sidebar onCancel={this.deactivateSidebar} 
                   onNewSection={this.addNewSection}
                   onNovelExport={this.exportNovel}
                   onNovelClose={this.close}
                   onNovelEdit={this.editNovelMeta}
                   ref="sidebar" />
        </div>
      )
    }
  });


  return Screen

}
