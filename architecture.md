# Map Editor Architektur

Grundidee: ein Problem nach dem anderen lösen. Sprich: wir machen erstmal die nötigsten Basics: Wände platzieren.

## IPlaceable

Das Interface aller auf der Karte platzierbaren Objekte. Enthält:

* Position auf der Karte

## IRotateable

Das Interface aller rotierbaren Objekte. Enthält:

* Rotation (0, 45, 90)

## IJoinable

Das Interface aller Objekte, die aneinander snappen können. Enthält:

* Joint-Positionen

## Features

Ein Enum:

* Placeable
* Rotateable
* Joinable

## MapObject

Die Basisklasse für alles, was für die Karte relevant ist. Es gibt nur eine Property:

* Features - Eine Liste aller Eigenschaften, die dieses Objekt hat.

## Walls

Ein Wall-Objekt stellt eine einzelne Wand da. Ein wall-Objekt besteht aus:

* einer Grafik
* Position auf der Karte
* Rotation der Wand (0, 45, 90)
* Joint-Positionen

Die Joint-Positionen werden genutzt um Walls miteinander zu verbinden. Und damit sind wir schon beim nächsten Objekt

## Structures

Wenn man zwei Wände an ihren Joints miteinander verbindet, entsteht eine Structure.
Eine Structure kombiniert alle miteinander verbundenen Wall-Objekte zu einem Objekt.
Es ergibt sich daraus eine neue Eigenständige Position und Rotation.

Structures haben demzufolge:

* Eine Liste von Wall-Objekten
* Position
* Rotation
* Joint-Positionen