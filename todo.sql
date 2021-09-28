CREATE TABLE IF NOT EXISTS `todo_app`.`todo` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `todo` VARCHAR(45) NOT NULL,
  `index_number` BIGINT NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE)
ENGINE = InnoDB