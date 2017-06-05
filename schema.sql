CREATE TABLE artists (arid varchar(32) primary key, artist text not null, data text not null, created timestamp default current_timestamp not null, modified timestamp);
CREATE TABLE releases (reid varchar(32) primary key, arid varchar(32) not null, data text not null, created timestamp default current_timestamp not null, modified timestamp, constraint fk_releases_reid foreign key (arid) references artists (arid));
CREATE INDEX idx_releases_arid on releases (arid);
