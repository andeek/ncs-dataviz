##libraries ----------------
library(jsonlite)
library(dplyr)
library(tidyr)
library(ggplot2)


##data ----------------------
ncs <- fromJSON("data/ncs.json")
ncs_dat <- data.frame(t(ncs$estimates))
names(ncs_dat) <- ncs$variable_names
ncs_dat$fips <- ncs$site_ids
ncs_dat[ncs_dat$fips == "comb1", "fips"] <- "46011 + 27173 + 27117 + 27081"

ncs_dat %>%
  gather(variable, metric, -fips, na.rm = TRUE) %>%
  left_join(data.frame(variable = ncs$variable_names, type = ncs$variable_types)) %>%
  separate(variable, into = c("category", "value"), sep = ": ") -> ncs_dat_long

site <- data.frame(do.call(cbind, fromJSON("data/sites.json")))
writeLines(toJSON(lapply(split(ncs_dat_long %>% left_join(site %>% select(fips, shortname) %>% rename(name = shortname)), ncs_dat_long$category), function(dat) {
  dat %>% 
    spread(value, metric, fill = 0)
})), "data/ncs_long.json")

##plots ------------------
ncs_dat_long %>% 
  ggplot() +
  geom_line(aes(x = value, y = metric, group = fips)) +
  facet_wrap(~category, scales = "free_x")
  
ncs_dat_long %>%
  filter(category == "Education") %>%
  left_join(site) %>%
  ggplot() +
  geom_bar(aes(name, weight = metric, fill = value)) +
  coord_flip()

