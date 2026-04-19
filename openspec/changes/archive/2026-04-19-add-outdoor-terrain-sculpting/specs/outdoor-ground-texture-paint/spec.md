## ADDED Requirements

### Requirement: Outdoor texture paint SHALL remain aligned on sculpted terrain
The system SHALL keep outdoor ground texture paint mapped to the sculpted outdoor terrain surface so texture-painted areas remain visually aligned after terrain elevation changes.

#### Scenario: Painted textures remain attached to sculpted terrain
- **WHEN** an outdoor area has texture paint assignments and that terrain is sculpted upward or downward
- **THEN** the painted texture remains rendered on the corresponding terrain area
- **AND** the texture does not appear mirrored, detached, or projected onto the old flat plane

#### Scenario: Texture paint stays editable after sculpting
- **WHEN** the user paints or erases outdoor ground texture on already sculpted terrain
- **THEN** the same texture-paint workflow remains available
- **AND** the resulting painted area aligns with the sculpted surface
