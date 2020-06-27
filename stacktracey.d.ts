declare interface SourceFile {

    path: string
    text: string
    lines: string[]
    error?: Error
}

declare interface Location {

    file:    string
    line?:   number
    column?: number
}

declare interface Entry extends Location {

    beforeParse: string
    callee:      string
    index:       boolean
    native:      boolean

    calleeShort:  string
    fileRelative: string
    fileShort:    string
    fileName:     string
    thirdParty:   boolean

    hide?:       boolean
    sourceLine?: string
    sourceFile?: SourceFile
    error?:      Error
}

declare interface MaxColumnWidths {
    callee:     number
    file:       number
    sourceLine: number
}

declare class StackTracey {

    constructor (input?: Error|string|Entry[], offset?: number)

    items: Entry[]

    extractEntryMetadata (e: Entry)

    shortenPath (relativePath: string): string
    relativePath (fullPath: string): string
    isThirdParty (relativePath: string): boolean

    rawParse (str: string): Entry[]

    withSourceAt (i: number): Entry

    withSource (entry: Entry): Entry

    withSources ():        StackTracey
    mergeRepeatedLines (): StackTracey
    clean ():              StackTracey

    map    (f: (x: Entry, i: number, arr: Entry[]) => Entry): StackTracey
    filter (f: (x: Entry, i: number, arr: Entry[]) => Entry): StackTracey
    slice  (from?: number, to?: number):                      StackTracey
    concat (...args: Entry[]):                                StackTracey

    at (i: number): Entry

    asTable (opts?: { maxColumnWidths?: MaxColumnWidths }): string

    maxColumnWidths (): MaxColumnWidths

    static resetCache (): void
    static locationsEqual (a: Location, b: Location): boolean
}

export = StackTracey