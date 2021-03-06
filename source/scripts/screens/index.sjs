module.exports = function(screenManager, storage) {

  return {
    Entry: require('./entry')(screenManager, storage),
    Editor: require('./editor')(screenManager, storage),

    SetupFolder: require('./folder-config')(screenManager, storage),

    SettingsDialog: require('./raven-config')(screenManager, storage),
    AboutDialog: require('./about')(screenManager, storage),
    StoryDialog: require('./story-metadata')(screenManager, storage),
    ExportDialog: require('./export-novel')(screenManager, storage),
    ImportDialog: require('./import-novel')(screenManager, storage)
  }

}
